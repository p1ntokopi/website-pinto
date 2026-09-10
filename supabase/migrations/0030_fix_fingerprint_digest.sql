-- 0030_fix_fingerprint_digest.sql
-- Fix: function digest(text, unknown) does not exist error.
-- PostgreSQL standard built-in sha256(convert_to(text, 'UTF8')) in pg_catalog
-- is used instead of pgcrypto digest(), which required extensions schema and bytea input.

-- 1. Cashier order creation
create or replace function public.create_cashier_order(
  p_idempotency_key text,
  p_items jsonb,
  p_table_id uuid default null,
  p_customer_name text default null,
  p_notes text default null,
  p_fulfillment_type public.fulfillment_type default 'PICKUP',
  p_dining_session_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid;
  v_existing public.orders%rowtype;
  v_table public.tables%rowtype;
  v_session public.dining_sessions%rowtype;
  v_order_id uuid := gen_random_uuid();
  v_order_number text;
  v_item jsonb;
  v_options jsonb;
  v_option jsonb;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_coffee_variant public.coffee_variants%rowtype;
  v_coffee_product public.coffee_products%rowtype;
  v_option_row public.product_options%rowtype;
  v_value_row public.product_option_values%rowtype;
  v_order_item_id uuid;
  v_product_id uuid;
  v_variant_id uuid;
  v_coffee_variant_id uuid;
  v_quantity int;
  v_unit_price numeric(12,2);
  v_option_total numeric(12,2);
  v_item_subtotal numeric(12,2);
  v_total numeric(12,2) := 0;
  v_product_name text;
  v_variant_name text;
  v_required_missing boolean;
  v_request_fingerprint text;
begin
  v_actor := public.require_cashier();
  if nullif(btrim(p_idempotency_key), '') is null
     or length(btrim(p_idempotency_key)) > 200 then
    raise exception using errcode = '22023', message = 'Idempotency key is required and must not exceed 200 characters';
  end if;
  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 50 then
    raise exception using errcode = '22023', message = 'Order must contain between 1 and 50 items';
  end if;
  if length(coalesce(p_customer_name, '')) > 120
     or length(coalesce(p_notes, '')) > 1000 then
    raise exception using errcode = '22023', message = 'Customer name or notes exceed the allowed length';
  end if;
  v_request_fingerprint := encode(sha256(convert_to(jsonb_build_object(
    'actor_id', v_actor,
    'items', p_items,
    'table_id', p_table_id,
    'customer_name', nullif(btrim(p_customer_name), ''),
    'notes', nullif(btrim(p_notes), ''),
    'fulfillment_type', p_fulfillment_type,
    'dining_session_id', p_dining_session_id
  )::text, 'UTF8')), 'hex');
  if p_fulfillment_type is null
     or p_fulfillment_type not in ('TABLE', 'PICKUP') then
    raise exception using errcode = '22023', message = 'Fulfillment must be TABLE or PICKUP';
  end if;
  if (p_fulfillment_type = 'TABLE') <> (p_table_id is not null) then
    raise exception using errcode = '22023', message = 'TABLE requires a table; PICKUP must not have one';
  end if;

  select * into v_existing from public.orders
  where client_request_id = 'cashier:' || btrim(p_idempotency_key);
  if found then
    if v_existing.request_fingerprint is null
       or v_existing.request_fingerprint is distinct from v_request_fingerprint then
      raise exception using errcode = '23505', message = 'Idempotency key was already used with different order data';
    end if;
    return jsonb_build_object('success', true, 'duplicate', true,
      'order_id', v_existing.id, 'order_number', v_existing.order_number,
      'status', v_existing.status, 'total', v_existing.total);
  end if;

  if p_table_id is not null then
    -- Serialize all open-session decisions for one table. This lock is shared
    -- with the anonymous start/resume RPC below.
    perform pg_advisory_xact_lock(hashtextextended('dining-table:' || p_table_id::text, 0));
    select * into v_table from public.tables where id = p_table_id and is_active = true;
    if not found then raise exception using errcode = 'P0002', message = 'Active table not found'; end if;

    if p_dining_session_id is not null then
      select * into v_session from public.dining_sessions
      where id = p_dining_session_id and table_id = p_table_id and status = 'open'
      for update;
      if not found then raise exception using errcode = 'P0002', message = 'Open dining session not found'; end if;
    else
      select * into v_session from public.dining_sessions
      where table_id = p_table_id and status = 'open'
      order by started_at desc limit 1 for update;
      if not found then
        insert into public.dining_sessions(table_id, session_token, status)
        values (p_table_id, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'open')
        returning * into v_session;
      end if;
    end if;
    p_dining_session_id := v_session.id;
    -- Shared with session checkout/completion: no TABLE order may appear after
    -- the payable total has been captured in the same transaction window.
    perform pg_advisory_xact_lock(hashtextextended('payment-session:' || p_dining_session_id::text, 0));
    if not exists (
      select 1 from public.dining_sessions
      where id = p_dining_session_id and status = 'open'
    ) then
      raise exception using errcode = '23514', message = 'Dining session is no longer open';
    end if;
    if exists (
      select 1 from public.payments
      where dining_session_id = p_dining_session_id and status = 'PAID'
    ) then
      -- A committed order retry stays idempotent even after checkout.
      select * into v_existing from public.orders
      where client_request_id = 'cashier:' || btrim(p_idempotency_key);
      if found then
        if v_existing.request_fingerprint is null
           or v_existing.request_fingerprint is distinct from v_request_fingerprint then
          raise exception using errcode = '23505', message = 'Idempotency key was already used with different order data';
        end if;
        return jsonb_build_object('success', true, 'duplicate', true,
          'order_id', v_existing.id, 'order_number', v_existing.order_number,
          'status', v_existing.status, 'total', v_existing.total);
      end if;
      raise exception using errcode = '23514', message = 'Paid dining session cannot receive another order';
    end if;
  elsif p_dining_session_id is not null then
    raise exception using errcode = '22023', message = 'PICKUP order cannot target a dining session';
  end if;

  v_order_number := public.next_order_number();
  insert into public.orders(id, order_number, order_type, fulfillment_type,
    table_id, dining_session_id, customer_name, notes, status,
    client_request_id, source, created_by, request_fingerprint)
  values (v_order_id, v_order_number,
    case when p_fulfillment_type = 'TABLE' then 'DINE_IN'::public.order_type else 'TAKEAWAY'::public.order_type end,
    p_fulfillment_type, p_table_id, p_dining_session_id,
    coalesce(nullif(btrim(p_customer_name), ''),
      case when p_table_id is not null then 'Meja ' || v_table.table_number else 'Walk-in' end),
    nullif(btrim(p_notes), ''), 'NEW',
    'cashier:' || btrim(p_idempotency_key), 'CASHIER', v_actor,
    v_request_fingerprint);

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := nullif(v_item->>'product_id', '')::uuid;
    v_variant_id := nullif(v_item->>'variant_id', '')::uuid;
    v_coffee_variant_id := nullif(v_item->>'coffee_variant_id', '')::uuid;
    v_quantity := nullif(v_item->>'quantity', '')::int;
    v_options := coalesce(v_item->'options', '[]'::jsonb);
    v_option_total := 0;
    v_variant_name := null;

    if v_quantity is null or v_quantity < 1 or v_quantity > 99 then
      raise exception using errcode = '22023', message = 'Item quantity must be between 1 and 99';
    end if;
    if num_nonnulls(v_product_id, v_coffee_variant_id) <> 1 then
      raise exception using errcode = '22023', message = 'Item requires exactly one product or coffee variant';
    end if;
    if jsonb_typeof(v_options) <> 'array'
       or jsonb_array_length(v_options) > 20 then
      raise exception using errcode = '22023', message = 'Item options must be an array with at most 20 entries';
    end if;
    if length(coalesce(v_item->>'notes', '')) > 500 then
      raise exception using errcode = '22023', message = 'Item notes exceed the allowed length';
    end if;

    if v_product_id is not null then
      select * into v_product from public.products
      where id = v_product_id and is_available = true;
      if not found then raise exception using errcode = 'P0002', message = 'Product not found or unavailable'; end if;
      v_product_name := v_product.name;
      v_unit_price := v_product.base_price;
      if v_variant_id is not null then
        select * into v_variant from public.product_variants
        where id = v_variant_id and product_id = v_product_id and is_available = true;
        if not found then raise exception using errcode = 'P0002', message = 'Variant not found or unavailable'; end if;
        v_unit_price := v_variant.price;
        v_variant_name := v_variant.name;
      end if;
    else
      if v_variant_id is not null then
        raise exception using errcode = '22023', message = 'Product variant cannot be combined with coffee variant';
      end if;
      select * into v_coffee_variant from public.coffee_variants
      where id = v_coffee_variant_id and is_available = true;
      if not found then raise exception using errcode = 'P0002', message = 'Coffee variant not found or unavailable'; end if;
      select * into strict v_coffee_product from public.coffee_products where id = v_coffee_variant.coffee_product_id;
      select * into strict v_product from public.products where id = v_coffee_product.product_id and is_available = true;
      v_product_name := v_product.name;
      v_unit_price := v_coffee_variant.price;
      v_variant_name := concat_ws(' · ', v_coffee_variant.weight_grams || 'g', nullif(v_coffee_variant.grind_type, ''));
    end if;

    if v_coffee_variant_id is not null and jsonb_array_length(v_options) > 0 then
      raise exception using errcode = '22023', message = 'Coffee bean variants do not accept product options';
    end if;
    if v_product_id is not null then
      select exists (
        select 1 from public.product_options po
        where po.product_id = v_product_id and po.is_required
          and not exists (
            select 1 from jsonb_array_elements(v_options) supplied
            where nullif(supplied->>'option_id', '')::uuid = po.id
          )
      ) into v_required_missing;
      if v_required_missing then
        raise exception using errcode = '23514', message = 'Required product option is missing';
      end if;
      if exists (
        select 1 from jsonb_array_elements(v_options) supplied
        where nullif(supplied->>'option_id', '') is null
           or nullif(supplied->>'option_value_id', '') is null
      ) then
        raise exception using errcode = '22023', message = 'Product option selection is incomplete';
      end if;
      if exists (
        select 1 from (
          select supplied->>'option_id' as option_id, count(*)
          from jsonb_array_elements(v_options) supplied
          group by supplied->>'option_id' having count(*) > 1
        ) duplicate_options
      ) then
        raise exception using errcode = '23514', message = 'A product option can only be selected once';
      end if;
    end if;
    for v_option in select value from jsonb_array_elements(v_options)
    loop
      select * into v_option_row from public.product_options
      where id = nullif(v_option->>'option_id', '')::uuid and product_id = v_product_id;
      if not found then raise exception using errcode = 'P0002', message = 'Invalid product option'; end if;
      select * into v_value_row from public.product_option_values
      where id = nullif(v_option->>'option_value_id', '')::uuid
        and product_option_id = v_option_row.id and is_available = true;
      if not found then raise exception using errcode = 'P0002', message = 'Invalid or unavailable option value'; end if;
      v_option_total := v_option_total + v_value_row.price_adjustment;
    end loop;

    v_item_subtotal := (v_unit_price + v_option_total) * v_quantity;
    insert into public.order_items(order_id, product_id, coffee_variant_id,
      product_name_snapshot, variant_name_snapshot, quantity, unit_price, subtotal, notes)
    values (v_order_id, v_product_id, v_coffee_variant_id, v_product_name,
      nullif(v_variant_name, ''), v_quantity, v_unit_price, v_item_subtotal,
      nullif(btrim(v_item->>'notes'), '')) returning id into v_order_item_id;

    for v_option in select value from jsonb_array_elements(v_options)
    loop
      select * into strict v_option_row from public.product_options
      where id = (v_option->>'option_id')::uuid and product_id = v_product_id;
      select * into strict v_value_row from public.product_option_values
      where id = (v_option->>'option_value_id')::uuid
        and product_option_id = v_option_row.id and is_available = true;
      insert into public.order_item_options(order_item_id, option_name_snapshot,
        option_value_snapshot, price_adjustment)
      values (v_order_item_id, v_option_row.name, v_value_row.name, v_value_row.price_adjustment);
    end loop;
    v_total := v_total + v_item_subtotal;
  end loop;

  update public.orders set subtotal = v_total, total = v_total where id = v_order_id;
  insert into public.order_status_history(order_id, old_status, new_status, changed_by, metadata)
  values (v_order_id, null, 'NEW', v_actor, jsonb_build_object('source', 'cashier'));
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (v_actor, 'cashier.order_created', 'orders', v_order_id,
    jsonb_build_object('order_number', v_order_number, 'total', v_total,
      'fulfillment_type', p_fulfillment_type, 'dining_session_id', p_dining_session_id));

  return jsonb_build_object('success', true, 'duplicate', false,
    'order_id', v_order_id, 'order_number', v_order_number, 'status', 'NEW', 'total', v_total);
exception
  when unique_violation then
    select * into v_existing from public.orders
    where client_request_id = 'cashier:' || btrim(p_idempotency_key);
    if found then
      if v_existing.request_fingerprint is null
         or v_existing.request_fingerprint is distinct from v_request_fingerprint then
        raise exception using errcode = '23505', message = 'Idempotency key was already used with different order data';
      end if;
      return jsonb_build_object('success', true, 'duplicate', true,
        'order_id', v_existing.id, 'order_number', v_existing.order_number,
        'status', v_existing.status, 'total', v_existing.total);
    end if;
    raise;
end;
$$;

-- 2. Cashier payment confirmation
create or replace function public.confirm_cashier_payment(
  p_idempotency_key text,
  p_method text,
  p_order_id uuid default null,
  p_dining_session_id uuid default null,
  p_tendered_amount numeric default null,
  p_cashier_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid;
  v_existing public.payments%rowtype;
  v_order public.orders%rowtype;
  v_session public.dining_sessions%rowtype;
  v_amount numeric(12,2);
  v_payment_id uuid;
  v_receipt_id uuid;
  v_snapshot jsonb;
  v_receipt_number text;
  v_billable_orders int;
  v_cash_received numeric(12,2);
  v_change_amount numeric(12,2);
  v_confirmed_at timestamptz;
begin
  v_actor := public.require_cashier();
  if nullif(btrim(p_idempotency_key), '') is null then
    raise exception using errcode = '22023', message = 'Idempotency key is required';
  end if;
  if p_method not in ('CASH', 'QRIS') then
    raise exception using errcode = '22023', message = 'Cashier payment method must be CASH or QRIS';
  end if;
  if p_tendered_amount is not null
     and (p_tendered_amount in ('Infinity'::numeric, '-Infinity'::numeric, 'NaN'::numeric)
       or scale(p_tendered_amount) > 2) then
    raise exception using errcode = '22023', message = 'Tendered amount must be a finite currency value with at most two decimals';
  end if;
  if num_nonnulls(p_order_id, p_dining_session_id) <> 1 then
    raise exception using errcode = '22023', message = 'Payment must target exactly one order or dining session';
  end if;
  if p_cashier_metadata is null or jsonb_typeof(p_cashier_metadata) <> 'object' then
    raise exception using errcode = '22023', message = 'Cashier metadata must be a JSON object';
  end if;
  if p_method = 'QRIS'
     and p_cashier_metadata->'qrisAccepted' is distinct from 'true'::jsonb then
    raise exception using errcode = '22023', message = 'QRIS acceptance must be explicitly confirmed';
  end if;

  -- Serialize this idempotency key even before its row exists.
  perform pg_advisory_xact_lock(hashtextextended('cashier-payment:' || btrim(p_idempotency_key), 0));
  select * into v_existing from public.payments
  where idempotency_key = btrim(p_idempotency_key) for update;
  if found then
    if v_existing.payment_origin <> 'CASHIER'
       or v_existing.cashier_id is distinct from v_actor
       or v_existing.order_id is distinct from p_order_id
       or v_existing.dining_session_id is distinct from p_dining_session_id
       or v_existing.payment_method is distinct from p_method then
      raise exception using errcode = '23505', message = 'Idempotency key was already used with different payment data';
    end if;
    if p_method = 'CASH'
       and p_tendered_amount is distinct from v_existing.cash_received then
      raise exception using errcode = '23505', message = 'Idempotent retry tender does not match the stored payment';
    end if;
    if p_method = 'QRIS'
       and p_tendered_amount is not null
       and p_tendered_amount is distinct from v_existing.amount then
      raise exception using errcode = '23505', message = 'Idempotent retry amount does not match the stored payment';
    end if;
    if p_method = 'QRIS'
       and v_existing.cashier_metadata->'qrisAccepted' is distinct from 'true'::jsonb then
      raise exception using errcode = '23514', message = 'Stored QRIS confirmation is invalid';
    end if;
    select id, receipt_number into v_receipt_id, v_receipt_number
    from public.receipts where payment_id = v_existing.id;
    return jsonb_build_object('success', true, 'duplicate', true,
      'payment_id', v_existing.id, 'receipt_id', v_receipt_id,
      'receipt_number', v_receipt_number,
      'amount', v_existing.amount,
      'cash_received', v_existing.cash_received,
      'change', v_existing.change_amount,
      'confirmed_at', v_existing.confirmed_at);
  end if;

  if p_order_id is not null then
    select * into v_order from public.orders where id = p_order_id for update;
    if not found then raise exception using errcode = 'P0002', message = 'Order not found'; end if;
    if v_order.status = 'CANCELLED' then
      raise exception using errcode = '23514', message = 'Cancelled order cannot be paid';
    end if;
    -- Session orders are always paid as one session-level target. This removes
    -- order/session cross-target races and keeps one durable receipt per table bill.
    if v_order.dining_session_id is not null then
      raise exception using errcode = '23514', message = 'Dining-session orders must be paid through the dining session';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('payment-order:' || p_order_id::text, 0));
    if exists (select 1 from public.payments where order_id = p_order_id and status = 'PAID') then
      raise exception using errcode = '23505', message = 'Order is already paid';
    end if;
    v_amount := v_order.total;
  else
    select * into v_session from public.dining_sessions where id = p_dining_session_id for update;
    if not found then raise exception using errcode = 'P0002', message = 'Dining session not found'; end if;
    if v_session.status <> 'open' then
      raise exception using errcode = '23514', message = 'Only an open dining session can be paid';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('payment-session:' || p_dining_session_id::text, 0));
    -- Refresh after waiting: a concurrent payment/completion may have committed.
    select * into v_session from public.dining_sessions where id = p_dining_session_id for update;
    if v_session.status <> 'open' then
      raise exception using errcode = '23514', message = 'Only an open dining session can be paid';
    end if;
    -- Lock every current order so customer/cashier creation and payment cannot
    -- produce a partially captured session total.
    perform 1 from public.orders
    where dining_session_id = p_dining_session_id order by id for update;
    if exists (select 1 from public.payments where dining_session_id = p_dining_session_id and status = 'PAID') then
      raise exception using errcode = '23505', message = 'Dining session is already paid';
    end if;
    select count(*) filter (where status <> 'CANCELLED') into v_billable_orders
    from public.orders where dining_session_id = p_dining_session_id;
    if v_billable_orders = 0 then
      raise exception using errcode = '23514', message = 'Dining session has no billable orders';
    end if;
    if exists (
      select 1 from public.orders o join public.payments p on p.order_id = o.id
      where o.dining_session_id = p_dining_session_id and p.status = 'PAID'
    ) then
      raise exception using errcode = '23505', message = 'Dining session contains an individually paid order';
    end if;
    select coalesce(sum(total), 0) into v_amount from public.orders
    where dining_session_id = p_dining_session_id and status <> 'CANCELLED';
  end if;

  if v_amount <= 0 then raise exception using errcode = '23514', message = 'Payment amount must be positive'; end if;
  -- Recheck after target locking: provider webhooks and cashier checkout share
  -- these advisory keys, so neither stream can commit a second PAID target.
  if p_order_id is not null then
    if exists (
      select 1 from public.payments
      where order_id = p_order_id and status = 'PAID'
    ) then
      raise exception using errcode = '23505', message = 'Order is already paid';
    end if;
  elsif exists (
    select 1 from public.payments
    where dining_session_id = p_dining_session_id and status = 'PAID'
  ) then
    raise exception using errcode = '23505', message = 'Dining session is already paid';
  end if;
  if p_method = 'CASH' and (p_tendered_amount is null or p_tendered_amount < v_amount) then
    raise exception using errcode = '22023', message = 'Cash tendered must cover the payable amount';
  end if;
  if p_method = 'QRIS' and p_tendered_amount is not null and p_tendered_amount <> v_amount then
    raise exception using errcode = '22023', message = 'QRIS tendered amount must equal the payable amount';
  end if;

  v_cash_received := case when p_method = 'CASH' then p_tendered_amount else null end;
  v_change_amount := case when p_method = 'CASH' then p_tendered_amount - v_amount else 0 end;
  v_confirmed_at := clock_timestamp();

  insert into public.payments(order_id, dining_session_id, provider,
    provider_transaction_id, reference_id, status, amount, paid_at,
    payment_method, payment_channel, cashier_id, cashier_metadata,
    idempotency_key, payment_origin, confirmed_by, confirmed_at,
    cash_received, change_amount, raw_response)
  values (p_order_id, p_dining_session_id, 'MANUAL',
    'cashier-' || encode(sha256(convert_to(btrim(p_idempotency_key), 'UTF8')), 'hex'),
    coalesce(v_order.order_number, p_dining_session_id::text), 'PAID', v_amount,
    v_confirmed_at, p_method, p_method, v_actor, p_cashier_metadata,
    btrim(p_idempotency_key), 'CASHIER', v_actor, v_confirmed_at,
    v_cash_received, v_change_amount, jsonb_build_object(
      'source', 'confirm_cashier_payment',
      'cash_received', v_cash_received,
      'change_amount', v_change_amount
    )) returning id into v_payment_id;

  if p_order_id is not null and v_order.status = 'PENDING_PAYMENT' then
    update public.orders set status = 'NEW', updated_at = clock_timestamp() where id = p_order_id;
    insert into public.order_status_history(order_id, old_status, new_status, changed_by, metadata)
    values (p_order_id, 'PENDING_PAYMENT', 'NEW', v_actor,
      jsonb_build_object('source', 'cashier_payment', 'payment_id', v_payment_id));
  end if;

  v_snapshot := public.build_receipt_snapshot(v_payment_id, p_order_id, p_dining_session_id);
  v_receipt_number := 'R-' || to_char(clock_timestamp() at time zone 'Asia/Jakarta', 'YYMMDD')
    || '-' || upper(substr(replace(v_payment_id::text, '-', ''), 1, 10));
  insert into public.receipts(payment_id, order_id, dining_session_id,
    receipt_number, snapshot, issued_by)
  values (v_payment_id, p_order_id, p_dining_session_id,
    v_receipt_number, v_snapshot, v_actor) returning id into v_receipt_id;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (v_actor, 'cashier.payment_confirmed', 'payments', v_payment_id,
    jsonb_build_object('order_id', p_order_id, 'dining_session_id', p_dining_session_id,
      'method', p_method, 'amount', v_amount, 'receipt_id', v_receipt_id));

  return jsonb_build_object('success', true, 'duplicate', false,
    'payment_id', v_payment_id, 'receipt_id', v_receipt_id,
    'receipt_number', v_receipt_number, 'amount', v_amount,
    'cash_received', v_cash_received, 'change', v_change_amount,
    'confirmed_at', v_confirmed_at);
end;
$$;

-- 3. Customer table order creation
create or replace function public.create_customer_order(
  p_table_slug text,
  p_session_token text,
  p_request_id text,
  p_notes text,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_table_id uuid;
  v_table_number text;
  v_session_id uuid;
  v_order_id uuid := gen_random_uuid();
  v_order_number text;
  v_existing public.orders%rowtype;
  v_item jsonb;
  v_option jsonb;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_option_row public.product_options%rowtype;
  v_value_row public.product_option_values%rowtype;
  v_product_id uuid;
  v_variant_id uuid;
  v_quantity int;
  v_options jsonb;
  v_unit_price numeric(12,2);
  v_option_total numeric(12,2);
  v_item_subtotal numeric(12,2);
  v_total numeric(12,2) := 0;
  v_order_item_id uuid;
  v_required_missing boolean;
  v_scoped_request_id text;
  v_legacy_request_id text;
  v_request_fingerprint text;
begin
  if nullif(btrim(p_request_id), '') is null
     or length(btrim(p_request_id)) > 200 then
    return jsonb_build_object('success', false, 'error', 'Permintaan tidak valid');
  end if;
  if length(coalesce(p_table_slug, '')) > 160
     or length(coalesce(p_session_token, '')) > 256
     or length(coalesce(p_notes, '')) > 1000 then
    return jsonb_build_object('success', false, 'error', 'Permintaan melebihi batas yang diizinkan');
  end if;
  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 50 then
    return jsonb_build_object('success', false, 'error', 'Keranjang harus berisi 1 sampai 50 item');
  end if;

  select id, table_number into v_table_id, v_table_number
  from public.tables
  where (
    slug = p_table_slug
    or (p_table_slug ~ '^table-[0-9]$' and slug = 'table-0' || substr(p_table_slug, 7))
    or (p_table_slug ~ '^table-0[0-9]$' and slug = 'table-' || substr(p_table_slug, 8))
  )
  and is_active = true
  limit 1;
  if v_table_id is null then
    return jsonb_build_object('success', false, 'error', 'Meja tidak ditemukan atau tidak aktif');
  end if;

  select id into v_session_id from public.dining_sessions
  where table_id = v_table_id and session_token = p_session_token and status = 'open'
  order by started_at desc limit 1 for update;
  if v_session_id is null then
    return jsonb_build_object('success', false, 'error', 'Sesi tidak valid atau sudah ditutup');
  end if;
  -- Shared with cashier checkout/completion. Once payment owns this lock no new
  -- order can be committed into the captured session bill.
  perform pg_advisory_xact_lock(hashtextextended('payment-session:' || v_session_id::text, 0));
  if not exists (
    select 1 from public.dining_sessions
    where id = v_session_id and status = 'open'
  ) then
    return jsonb_build_object('success', false, 'error', 'Sesi tidak valid atau sudah ditutup');
  end if;

  -- Serialize raw pre-cutover request ids too, so compatibility lookup cannot
  -- race another session attempting the same globally unique legacy key.
  perform pg_advisory_xact_lock(hashtextextended('customer-request:' || btrim(p_request_id), 0));
  v_scoped_request_id := 'customer:' || v_session_id::text || ':' || btrim(p_request_id);
  v_request_fingerprint := encode(sha256(convert_to(jsonb_build_object(
    'session_id', v_session_id,
    'items', p_items,
    'notes', nullif(btrim(p_notes), '')
  )::text, 'UTF8')), 'hex');
  select * into v_existing from public.orders where client_request_id = v_scoped_request_id;
  if found then
    if v_existing.request_fingerprint is null
       or v_existing.request_fingerprint is distinct from v_request_fingerprint then
      return jsonb_build_object('success', false,
        'error', 'ID permintaan sudah digunakan dengan isi pesanan berbeda');
    end if;
    return jsonb_build_object('success', true, 'duplicate', true,
      'order_id', v_existing.id, 'order_number', v_existing.order_number,
      'status', v_existing.status);
  end if;

  -- Pre-cutover rows used the raw request id. Preserve retry behavior only when
  -- that legacy id belongs to this exact token-scoped dining session.
  v_legacy_request_id := btrim(p_request_id);
  select * into v_existing from public.orders
  where client_request_id = v_legacy_request_id and dining_session_id = v_session_id;
  if found then
    -- Rows created before request fingerprints existed retain their historical
    -- retry behavior. New scoped keys always require exact payload equality.
    return jsonb_build_object('success', true, 'duplicate', true,
      'order_id', v_existing.id, 'order_number', v_existing.order_number,
      'status', v_existing.status);
  end if;
  if exists (
    select 1 from public.orders where client_request_id = v_legacy_request_id
  ) then
    return jsonb_build_object('success', false,
      'error', 'ID permintaan sudah digunakan pada sesi lain');
  end if;

  if exists (
    select 1 from public.payments
    where dining_session_id = v_session_id and status = 'PAID'
  ) then
    return jsonb_build_object('success', false, 'error', 'Sesi sudah dibayar dan tidak dapat menerima pesanan baru');
  end if;

  v_order_number := public.next_order_number();
  insert into public.orders(id, order_number, order_type, fulfillment_type,
    table_id, dining_session_id, customer_name, notes, status,
    client_request_id, source, request_fingerprint)
  values (v_order_id, v_order_number, 'DINE_IN', 'TABLE', v_table_id, v_session_id,
    'Meja ' || v_table_number, nullif(btrim(p_notes), ''), 'NEW',
    v_scoped_request_id, 'CUSTOMER', v_request_fingerprint);

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := nullif(v_item->>'product_id', '')::uuid;
    v_variant_id := nullif(v_item->>'variant_id', '')::uuid;
    v_quantity := nullif(v_item->>'quantity', '')::int;
    v_options := coalesce(v_item->'options', '[]'::jsonb);
    v_option_total := 0;
    if v_product_id is null or v_quantity is null or v_quantity < 1 or v_quantity > 50 then
      raise exception using errcode = '22023', message = 'Invalid customer order item';
    end if;
    if jsonb_typeof(v_options) <> 'array'
       or jsonb_array_length(v_options) > 20 then
      raise exception using errcode = '22023', message = 'Item options must be an array with at most 20 entries';
    end if;
    if length(coalesce(v_item->>'notes', '')) > 500 then
      raise exception using errcode = '22023', message = 'Item notes exceed the allowed length';
    end if;
    select * into v_product from public.products where id = v_product_id and is_available = true;
    if not found then raise exception using errcode = 'P0002', message = 'Product not found or unavailable'; end if;
    v_unit_price := v_product.base_price;
    if v_variant_id is not null then
      select * into v_variant from public.product_variants
      where id = v_variant_id and product_id = v_product_id and is_available = true;
      if not found then raise exception using errcode = 'P0002', message = 'Variant not found or unavailable'; end if;
      v_unit_price := v_variant.price;
    end if;

    select exists (
      select 1 from public.product_options po
      where po.product_id = v_product_id and po.is_required
        and not exists (
          select 1 from jsonb_array_elements(v_options) supplied
          where nullif(supplied->>'option_id', '')::uuid = po.id
        )
    ) into v_required_missing;
    if v_required_missing then
      raise exception using errcode = '23514', message = 'Required product option is missing';
    end if;
    if exists (
      select 1 from jsonb_array_elements(v_options) supplied
      where nullif(supplied->>'option_id', '') is null
         or nullif(supplied->>'option_value_id', '') is null
    ) then
      raise exception using errcode = '22023', message = 'Product option selection is incomplete';
    end if;
    if exists (
      select 1 from (
        select supplied->>'option_id' as option_id, count(*)
        from jsonb_array_elements(v_options) supplied group by supplied->>'option_id' having count(*) > 1
      ) duplicate_options
    ) then
      raise exception using errcode = '23514', message = 'A product option can only be selected once';
    end if;

    for v_option in select value from jsonb_array_elements(v_options)
    loop
      select * into v_option_row from public.product_options
      where id = nullif(v_option->>'option_id', '')::uuid and product_id = v_product_id;
      if not found then raise exception using errcode = 'P0002', message = 'Invalid option for product'; end if;
      select * into v_value_row from public.product_option_values
      where id = nullif(v_option->>'option_value_id', '')::uuid
        and product_option_id = v_option_row.id and is_available = true;
      if not found then raise exception using errcode = 'P0002', message = 'Invalid or unavailable option value'; end if;
      v_option_total := v_option_total + v_value_row.price_adjustment;
    end loop;

    v_item_subtotal := (v_unit_price + v_option_total) * v_quantity;
    insert into public.order_items(order_id, product_id, product_name_snapshot,
      variant_name_snapshot, quantity, unit_price, subtotal, notes)
    values (v_order_id, v_product_id, v_product.name,
      case when v_variant_id is null then null else v_variant.name end,
      v_quantity, v_unit_price, v_item_subtotal, nullif(btrim(v_item->>'notes'), ''))
    returning id into v_order_item_id;

    for v_option in select value from jsonb_array_elements(v_options)
    loop
      select * into strict v_option_row from public.product_options
      where id = (v_option->>'option_id')::uuid and product_id = v_product_id;
      select * into strict v_value_row from public.product_option_values
      where id = (v_option->>'option_value_id')::uuid
        and product_option_id = v_option_row.id and is_available = true;
      insert into public.order_item_options(order_item_id, option_name_snapshot,
        option_value_snapshot, price_adjustment)
      values (v_order_item_id, v_option_row.name, v_value_row.name, v_value_row.price_adjustment);
    end loop;
    v_total := v_total + v_item_subtotal;
  end loop;

  update public.orders set subtotal = v_total, total = v_total where id = v_order_id;
  insert into public.order_status_history(order_id, old_status, new_status, metadata)
  values (v_order_id, null, 'NEW', jsonb_build_object('source', 'customer'));
  return jsonb_build_object('success', true, 'duplicate', false,
    'order_id', v_order_id, 'order_number', v_order_number, 'status', 'NEW');
exception
  when unique_violation then
    select * into v_existing from public.orders where client_request_id = v_scoped_request_id;
    if found then
      if v_existing.request_fingerprint is null
         or v_existing.request_fingerprint is distinct from v_request_fingerprint then
        return jsonb_build_object('success', false,
          'error', 'ID permintaan sudah digunakan dengan isi pesanan berbeda');
      end if;
      return jsonb_build_object('success', true, 'duplicate', true,
        'order_id', v_existing.id, 'order_number', v_existing.order_number,
        'status', v_existing.status);
    end if;
    return jsonb_build_object('success', false, 'error', 'Nomor pesanan bentrok; silakan coba lagi');
  when others then
    -- Anonymous callers receive a stable message; internal SQL details remain in
    -- PostgreSQL logs instead of being reflected through the RPC response.
    return jsonb_build_object('success', false,
      'error', 'Pesanan tidak dapat dibuat. Periksa item lalu coba lagi');
end;
$$;

-- 4. Start or resume dining session
-- Fix: function gen_random_bytes(integer) does not exist error by using standard replace(gen_random_uuid() || gen_random_uuid(), '-', '')
-- Also supports resilient table slug matching (e.g. table-1 and table-01).
drop function if exists public.start_or_resume_dining_session(text);
create function public.start_or_resume_dining_session(
  p_table_slug text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_table_id uuid;
  v_session public.dining_sessions%rowtype;
begin
  select id into v_table_id from public.tables
  where (
    slug = p_table_slug
    or (p_table_slug ~ '^table-[0-9]$' and slug = 'table-0' || substr(p_table_slug, 7))
    or (p_table_slug ~ '^table-0[0-9]$' and slug = 'table-' || substr(p_table_slug, 8))
  )
  and is_active = true
  limit 1;

  if v_table_id is null then
    return jsonb_build_object('success', false, 'error', 'Meja tidak ditemukan');
  end if;

  perform pg_advisory_xact_lock(hashtextextended('dining-table:' || v_table_id::text, 0));
  select * into v_session from public.dining_sessions
  where table_id = v_table_id and status = 'open'
  order by started_at desc limit 1 for update;
  if not found then
    insert into public.dining_sessions(table_id, session_token, status)
    values (v_table_id, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'open')
    returning * into v_session;
  end if;

  return jsonb_build_object('success', true,
    'session_token', v_session.session_token,
    'session_id', v_session.id,
    'status', v_session.status);
end;
$$;

-- 5. Validate dining session (with resilient slug matching)
drop function if exists public.validate_dining_session(text, text);
create function public.validate_dining_session(
  p_table_slug text,
  p_session_token text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session public.dining_sessions%rowtype;
begin
  select ds.* into v_session
  from public.dining_sessions ds join public.tables t on t.id = ds.table_id
  where (
    t.slug = p_table_slug
    or (p_table_slug ~ '^table-[0-9]$' and t.slug = 'table-0' || substr(p_table_slug, 7))
    or (p_table_slug ~ '^table-0[0-9]$' and t.slug = 'table-' || substr(p_table_slug, 8))
  )
    and ds.session_token = p_session_token
    and (
      ds.status = 'open'
      or coalesce(ds.closed_at, ds.completed_at) >= clock_timestamp() - interval '12 hours'
    )
  order by ds.started_at desc limit 1;
  if not found then return jsonb_build_object('success', false, 'error', 'Sesi tidak valid'); end if;
  return jsonb_build_object('success', true, 'session_id', v_session.id,
    'status', v_session.status, 'closed_at', v_session.closed_at,
    'can_order', v_session.status = 'open');
end;
$$;

-- 6. Dining session summary (with resilient slug matching)
drop function if exists public.get_dining_session_summary(text, text);
create function public.get_dining_session_summary(
  p_table_slug text,
  p_session_token text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session public.dining_sessions%rowtype;
  v_orders jsonb;
  v_payment jsonb;
  v_payment_status text;
  v_total numeric(12,2);
begin
  select ds.* into v_session
  from public.dining_sessions ds
  join public.tables t on t.id = ds.table_id
  where (
    t.slug = p_table_slug
    or (p_table_slug ~ '^table-[0-9]$' and t.slug = 'table-0' || substr(p_table_slug, 7))
    or (p_table_slug ~ '^table-0[0-9]$' and t.slug = 'table-' || substr(p_table_slug, 8))
  )
    and ds.session_token = p_session_token
    and (
      ds.status = 'open'
      or coalesce(ds.closed_at, ds.completed_at) >= clock_timestamp() - interval '12 hours'
    )
  order by ds.started_at desc limit 1;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Sesi meja tidak ditemukan');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', o.id,
    'order_number', o.order_number,
    'status', o.status,
    'total', o.total,
    'created_at', o.created_at
  ) order by o.created_at, o.order_number), '[]'::jsonb),
  coalesce(sum(o.total) filter (where o.status <> 'CANCELLED'), 0)
  into v_orders, v_total
  from public.orders o where o.dining_session_id = v_session.id;

  select jsonb_build_object(
    'id', p.id,
    'status', p.status,
    'method', p.payment_method,
    'amount', p.amount,
    'paid_at', p.paid_at
  ), p.status::text
  into v_payment, v_payment_status
  from public.payments p
  where p.dining_session_id = v_session.id
  order by (p.status = 'PAID') desc, coalesce(p.paid_at, p.created_at) desc
  limit 1;

  if v_payment_status is null then
    v_payment_status := 'UNPAID';
  end if;

  return jsonb_build_object(
    'success', true,
    'session_status', v_session.status,
    'payment_status', v_payment_status,
    'orders', v_orders,
    'total', coalesce(v_session.total_snapshot, v_total),
    'payment', coalesce(v_payment, 'null'::jsonb),
    'receipt', coalesce((
      select jsonb_build_object(
        'receipt_number', r.receipt_number,
        'issued_at', r.issued_at,
        'snapshot', r.snapshot
      )
      from public.receipts r
      join public.payments p on p.id = r.payment_id
      where p.dining_session_id = v_session.id and p.status = 'PAID'
      order by r.issued_at desc
      limit 1
    ), 'null'::jsonb),
    'closed_at', v_session.closed_at,
    'session', jsonb_build_object(
      'status', v_session.status,
      'payment_status', v_payment_status,
      'orders', v_orders,
      'total', coalesce(v_session.total_snapshot, v_total),
      'receipt', coalesce((
        select jsonb_build_object(
          'receipt_number', r.receipt_number,
          'issued_at', r.issued_at,
          'snapshot', r.snapshot
        )
        from public.receipts r
        join public.payments p on p.id = r.payment_id
        where p.dining_session_id = v_session.id and p.status = 'PAID'
        order by r.issued_at desc
        limit 1
      ), 'null'::jsonb),
      'closed_at', v_session.closed_at
    )
  );
end;
$$;

-- 7. Order tracking (with resilient slug matching)
drop function if exists public.get_order_tracking(text, text, text);
create function public.get_order_tracking(
  p_table_slug text,
  p_session_token text,
  p_order_number text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session_id uuid;
  v_session_status public.session_status;
  v_order jsonb;
begin
  select ds.id, ds.status into v_session_id, v_session_status
  from public.dining_sessions ds join public.tables t on t.id = ds.table_id
  where (
    t.slug = p_table_slug
    or (p_table_slug ~ '^table-[0-9]$' and t.slug = 'table-0' || substr(p_table_slug, 7))
    or (p_table_slug ~ '^table-0[0-9]$' and t.slug = 'table-' || substr(p_table_slug, 8))
  )
    and ds.session_token = p_session_token
    and (
      ds.status = 'open'
      or coalesce(ds.closed_at, ds.completed_at) >= clock_timestamp() - interval '12 hours'
    )
  order by ds.started_at desc limit 1;
  if v_session_id is null then return jsonb_build_object('success', false, 'error', 'Sesi tidak valid'); end if;

  select jsonb_build_object(
    'id', o.id, 'order_number', o.order_number, 'status', o.status,
    'total', o.total, 'session_status', v_session_status,
    'payment', coalesce((
      select jsonb_build_object('status', p.status, 'provider', p.provider,
        'payment_method', p.payment_method, 'payment_channel', p.payment_channel,
        'amount', p.amount, 'qr_url', p.qr_url, 'expires_at', p.expires_at)
      from public.payments p
      where p.order_id = o.id or (p.dining_session_id = v_session_id and p.status = 'PAID')
      order by (p.status = 'PAID') desc, p.created_at desc limit 1
    ), 'null'::jsonb),
    'items', coalesce(jsonb_agg(jsonb_build_object(
      'product_name', oi.product_name_snapshot,
      'variant_name', oi.variant_name_snapshot,
      'quantity', oi.quantity,
      'unit_price', oi.unit_price,
      'subtotal', oi.subtotal,
      'options', coalesce((
        select jsonb_agg(jsonb_build_object('name', oio.option_name_snapshot,
          'value', oio.option_value_snapshot, 'price_adjustment', oio.price_adjustment))
        from public.order_item_options oio where oio.order_item_id = oi.id
      ), '[]'::jsonb)
    )), '[]'::jsonb)
  ) into v_order
  from public.orders o
  left join public.order_items oi on oi.order_id = o.id
  where o.order_number = p_order_number and o.dining_session_id = v_session_id
  group by o.id, o.order_number, o.status, o.total;

  if v_order is null then return jsonb_build_object('success', false, 'error', 'Pesanan tidak ditemukan'); end if;
  return jsonb_build_object('success', true, 'order', v_order);
end;
$$;

-- Permissions
grant execute on function public.create_cashier_order(text, jsonb, uuid, text, text, public.fulfillment_type, uuid) to authenticated;
grant execute on function public.confirm_cashier_payment(text, text, uuid, uuid, numeric, jsonb) to authenticated;
grant execute on function public.create_customer_order(text, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.start_or_resume_dining_session(text) to anon, authenticated;
grant execute on function public.validate_dining_session(text, text) to anon, authenticated;
grant execute on function public.get_dining_session_summary(text, text) to anon, authenticated;
grant execute on function public.get_order_tracking(text, text, text) to anon, authenticated;


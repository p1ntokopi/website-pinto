-- 0019_xendit_payments.sql
-- Xendit Payment Session integration (Phase 33).
-- Orders are created as PENDING_PAYMENT and only become visible to the kitchen
-- (PENDING) after the Xendit payment webhook confirms the payment.

-- 1. Extend enums
alter type public.order_status add value if not exists 'PENDING_PAYMENT' before 'PENDING';
alter type public.payment_status add value if not exists 'CANCELED';

-- 2. Extend payments table with Xendit Payment Session fields
alter table public.payments
  add column if not exists payment_session_id text,
  add column if not exists reference_id text,
  add column if not exists payment_request_id text,
  add column if not exists payment_id text,
  add column if not exists payment_method text,
  add column if not exists payment_channel text,
  add column if not exists canceled_at timestamptz;

alter table public.payments alter column provider set default 'XENDIT';

create unique index if not exists payments_payment_session_id_key
  on public.payments(payment_session_id)
  where payment_session_id is not null;

-- 3. Webhook event log for idempotency (webhook-id based)
create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text unique not null,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text
);

alter table public.payment_webhook_events enable row level security;

-- 4. Record payment outcomes (called by webhook handler; service role bypasses RLS)
create or replace function public.record_order_payment(
  p_order_id uuid,
  p_provider text,
  p_provider_transaction_id text,
  p_amount numeric,
  p_status payment_status,
  p_paid_at timestamptz,
  p_raw jsonb,
  p_payment_session_id text default null,
  p_reference_id text default null,
  p_payment_request_id text default null,
  p_payment_id text default null,
  p_payment_method text default null,
  p_payment_channel text default null,
  p_expires_at timestamptz default null,
  p_canceled_at timestamptz default null
) returns uuid as $$
declare
  v_payment_id uuid;
  v_order_status text;
begin
  select id into v_payment_id
  from public.payments
  where provider_transaction_id = p_provider_transaction_id
  limit 1;

  if v_payment_id is null then
    insert into public.payments (
      order_id,
      provider,
      provider_transaction_id,
      status,
      amount,
      paid_at,
      raw_response,
      payment_session_id,
      reference_id,
      payment_request_id,
      payment_id,
      payment_method,
      payment_channel,
      expired_at,
      canceled_at
    ) values (
      p_order_id,
      p_provider,
      p_provider_transaction_id,
      p_status,
      p_amount,
      p_paid_at,
      p_raw,
      p_payment_session_id,
      p_reference_id,
      p_payment_request_id,
      p_payment_id,
      p_payment_method,
      p_payment_channel,
      p_expires_at,
      p_canceled_at
    )
    on conflict (provider_transaction_id) do nothing
    returning id into v_payment_id;

    -- A concurrent webhook may have inserted the row between our select and insert.
    if v_payment_id is null then
      select id into v_payment_id
      from public.payments
      where provider_transaction_id = p_provider_transaction_id
      limit 1;
    end if;
  else
    -- Idempotency: skip redundant writes when already PAID and event is PAID.
    update public.payments
    set status = p_status,
        paid_at = coalesce(p_paid_at, paid_at),
        raw_response = coalesce(p_raw, raw_response),
        payment_request_id = coalesce(p_payment_request_id, payment_request_id),
        payment_id = coalesce(p_payment_id, payment_id),
        payment_method = coalesce(p_payment_method, payment_method),
        payment_channel = coalesce(p_payment_channel, payment_channel),
        expired_at = coalesce(p_expires_at, expired_at),
        canceled_at = coalesce(p_canceled_at, canceled_at),
        updated_at = now()
    where id = v_payment_id
      and not (status = 'PAID' and p_status = 'PAID');
  end if;

  -- On successful payment, move the order into the kitchen queue.
  if p_status = 'PAID' then
    select status into v_order_status from public.orders where id = p_order_id;
    if v_order_status = 'PENDING_PAYMENT' then
      update public.orders set status = 'PENDING', updated_at = now() where id = p_order_id;
      insert into public.order_status_history (
        order_id, old_status, new_status, changed_by, metadata
      ) values (
        p_order_id, 'PENDING_PAYMENT', 'PENDING', null,
        jsonb_build_object('source', 'xendit_webhook', 'payment_id', v_payment_id)
      );
    end if;
  end if;

  return v_payment_id;
end;
$$ language plpgsql security definer set search_path = public;

-- 5. create_customer_order now creates orders as PENDING_PAYMENT (paid first).
drop function if exists public.create_customer_order(text, text, text, text, jsonb);

create or replace function public.create_customer_order(
  p_table_slug text,
  p_session_token text,
  p_request_id text,
  p_notes text,
  p_items jsonb
) returns jsonb as $$
declare
  v_table_id uuid;
  v_table_number text;
  v_session_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_total_amount numeric := 0;
  v_subtotal numeric := 0;
  v_item jsonb;
  v_product_id uuid;
  v_variant_id uuid;
  v_quantity int;
  v_item_notes text;
  v_item_options jsonb;
  v_option jsonb;
  v_product_record record;
  v_variant_record record;
  v_unit_price numeric;
  v_item_subtotal numeric;
  v_order_item_id uuid;
  v_option_id uuid;
  v_option_value_id uuid;
  v_option_record record;
  v_val_record record;
  v_option_price numeric;
  v_item_total_option_price numeric;
begin
  -- 0. Idempotency: return existing order if this request was already processed
  if p_request_id is not null and p_request_id <> '' then
    select id, order_number into v_order_id, v_order_number
    from public.orders
    where client_request_id = p_request_id
    limit 1;

    if found then
      return jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'duplicate', true
      );
    end if;
  end if;

  -- 1. Validate table
  select id, table_number into v_table_id, v_table_number
  from public.tables
  where slug = p_table_slug and is_active = true;

  if v_table_id is null then
    return jsonb_build_object('success', false, 'error', 'Meja tidak ditemukan atau tidak aktif');
  end if;

  -- 2. Validate dining session
  select id into v_session_id
  from public.dining_sessions
  where table_id = v_table_id and session_token = p_session_token and status = 'open'
  order by started_at desc
  limit 1;

  if v_session_id is null then
    return jsonb_build_object('success', false, 'error', 'Sesi tidak valid');
  end if;

  -- 3. Generate Order Number
  v_order_number := 'P1NTO-' || to_char(now(), 'YYMMDD') || '-' || lpad(cast(floor(random() * 10000) as text), 4, '0');

  -- 4. Create Order Record (Initial, awaiting payment)
  insert into public.orders (
    order_number,
    order_type,
    fulfillment_type,
    table_id,
    dining_session_id,
    customer_name,
    notes,
    status,
    client_request_id
  ) values (
    v_order_number,
    'DINE_IN',
    'SERVE_TO_TABLE',
    v_table_id,
    v_session_id,
    'Meja ' || v_table_number,
    p_notes,
    'PENDING_PAYMENT',
    p_request_id
  ) returning id into v_order_id;

  -- 5. Process Items
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;
    v_item_notes := v_item->>'notes';
    v_item_options := v_item->'options';
    v_item_total_option_price := 0;

    if v_quantity <= 0 or v_quantity > 50 then
      raise exception 'Invalid quantity';
    end if;

    -- Get Product
    select * into v_product_record from public.products
    where id = v_product_id and is_available = true;

    if not found then
      raise exception 'Product not found or unavailable';
    end if;

    v_unit_price := v_product_record.base_price;

    -- Get Variant if exists
    if v_variant_id is not null then
      select * into v_variant_record from public.product_variants
      where id = v_variant_id and product_id = v_product_id and is_available = true;

      if not found then
        raise exception 'Variant not found or unavailable';
      end if;

      v_unit_price := v_variant_record.price;
    end if;

    -- Insert Order Item (Initial, without options subtotal)
    insert into public.order_items (
      order_id,
      product_id,
      product_name_snapshot,
      variant_name_snapshot,
      quantity,
      unit_price,
      subtotal,
      notes
    ) values (
      v_order_id,
      v_product_id,
      v_product_record.name,
      v_variant_record.name,
      v_quantity,
      v_unit_price,
      0,
      v_item_notes
    ) returning id into v_order_item_id;

    -- Process Options
    if v_item_options is not null and jsonb_array_length(v_item_options) > 0 then
      for v_option in select * from jsonb_array_elements(v_item_options)
      loop
        v_option_id := (v_option->>'option_id')::uuid;
        v_option_value_id := (v_option->>'option_value_id')::uuid;

        select * into v_option_record from public.product_options
        where id = v_option_id and product_id = v_product_id;

        if not found then
          raise exception 'Invalid option for this product';
        end if;

        select * into v_val_record from public.product_option_values
        where id = v_option_value_id and product_option_id = v_option_id and is_available = true;

        if not found then
          raise exception 'Invalid option value';
        end if;

        v_option_price := v_val_record.price_adjustment;
        v_item_total_option_price := v_item_total_option_price + v_option_price;

        insert into public.order_item_options (
          order_item_id,
          option_name_snapshot,
          option_value_snapshot,
          price_adjustment
        ) values (
          v_order_item_id,
          v_option_record.name,
          v_val_record.name,
          v_option_price
        );
      end loop;
    end if;

    -- Calculate item total: (unit_price + options) * quantity
    v_item_subtotal := (v_unit_price + v_item_total_option_price) * v_quantity;

    -- Update item subtotal
    update public.order_items set subtotal = v_item_subtotal where id = v_order_item_id;

    -- Add to global total
    v_total_amount := v_total_amount + v_item_subtotal;
  end loop;

  -- 6. Finalize Order Totals
  update public.orders
  set
    subtotal = v_total_amount,
    total = v_total_amount
  where id = v_order_id;

  return jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number
  );
exception
  when others then
    return jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
end;
$$ language plpgsql security definer set search_path = public;

-- 6. get_order_tracking now returns the latest payment info for the order
create or replace function public.get_order_tracking(
  p_table_slug text,
  p_session_token text,
  p_order_number text
) returns jsonb as $$
declare
  v_table_id uuid;
  v_session_id uuid;
  v_order jsonb;
begin
  select id into v_table_id from public.tables
  where slug = p_table_slug and is_active = true;

  if v_table_id is null then
    return jsonb_build_object('success', false, 'error', 'Meja tidak ditemukan');
  end if;

  select id into v_session_id from public.dining_sessions
  where table_id = v_table_id and session_token = p_session_token and status = 'open'
  order by started_at desc
  limit 1;

  if v_session_id is null then
    return jsonb_build_object('success', false, 'error', 'Sesi tidak valid');
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'id', o.id,
      'order_number', o.order_number,
      'status', o.status,
      'total', o.total,
      'payment', (
        select jsonb_build_object(
          'status', p.status,
          'provider', p.provider,
          'payment_method', p.payment_method,
          'payment_channel', p.payment_channel,
          'amount', p.amount,
          'paid_at', p.paid_at,
          'expired_at', p.expired_at
        )
        from public.payments p
        where p.order_id = o.id
        order by p.created_at desc
        limit 1
      ),
      'items', (
        select coalesce(jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'quantity', oi.quantity,
            'product_name_snapshot', oi.product_name_snapshot,
            'variant_name_snapshot', oi.variant_name_snapshot,
            'unit_price', oi.unit_price,
            'subtotal', oi.subtotal,
            'notes', oi.notes,
            'options', (
              select coalesce(jsonb_agg(
                jsonb_build_object(
                  'option_value_snapshot', oio.option_value_snapshot,
                  'price_adjustment', oio.price_adjustment
                )
              ), '[]'::jsonb)
              from public.order_item_options oio
              where oio.order_item_id = oi.id
            )
          )
        ), '[]'::jsonb)
        from public.order_items oi
        where oi.order_id = o.id
      )
    )
  )
  into v_order
  from public.orders o
  where o.order_number = p_order_number
    and o.dining_session_id = v_session_id;

  if v_order is null then
    return jsonb_build_object('success', false, 'error', 'Pesanan tidak ditemukan');
  end if;

  return jsonb_build_object('success', true, 'order', (v_order->>0)::jsonb);
end;
$$ language plpgsql security definer set search_path = public;
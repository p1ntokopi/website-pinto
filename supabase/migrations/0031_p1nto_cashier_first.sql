-- 0031_p1nto_cashier_first.sql
-- Cashier-first ordering: the cashier opens the table session, the customer
-- confirms at the counter, and the table QR becomes a secondary channel that can
-- only ADD orders to a session the cashier already opened.
--
-- Additive and forward-only. Three changes:
--   1. start_or_resume_dining_session gains p_create_if_missing so the anonymous
--      QR path can resume-or-refuse instead of always creating a session.
--   2. get_table_session_status exposes ONLY table occupancy ("is this table
--      occupied") to the QR landing page. It never returns a session token.
--   3. create_cashier_order stops silently merging a new party into an existing
--      open session. An occupied table now raises 23514 unless the caller passed
--      an explicit p_dining_session_id ("Gabung ke Sesi").
--
-- The effective bodies below are copied verbatim from 0030_fix_fingerprint_digest
-- .sql (the SHA256/convert_to implementation confirmed live in production).
-- Do not reintroduce the retired pgcrypto digest()/gen_random_bytes() calls.

-- ---------------------------------------------------------------------------
-- 1. Gate session creation behind an explicit opt-in.
--
-- Adding a parameter creates a NEW overload; it does not replace the existing
-- one. The (text) signature must be dropped or a PostgREST call supplying only
-- p_table_slug matches both candidates and fails with PGRST203.
--
-- The default keeps every existing call site working while the customer path
-- passes an explicit false.
-- ---------------------------------------------------------------------------

drop function if exists public.start_or_resume_dining_session(text);

create or replace function public.start_or_resume_dining_session(
  p_table_slug text,
  p_create_if_missing boolean default false
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
    if not coalesce(p_create_if_missing, false) then
      -- The QR is secondary: with no session open, the customer orders at the
      -- counter. No session row is written here.
      return jsonb_build_object(
        'success', false,
        'code', 'NO_ACTIVE_SESSION',
        'error', 'Belum ada sesi meja aktif. Silakan melakukan pemesanan di kasir terlebih dahulu.');
    end if;
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

-- ---------------------------------------------------------------------------
-- 2. Table occupancy for the QR landing page.
--
-- "Is this table occupied" is already physically obvious to anyone standing at
-- the table, so exposing it is safe. The session token is NOT exposed: the
-- anonymous client still has to resume the session through change 1 to obtain a
-- credential. dining_sessions has no anon RLS policy by design, so this narrow
-- SECURITY DEFINER read is the only way the landing page can render occupancy.
--
-- stable and lock-free, so it is safe to call during a page render.
-- ---------------------------------------------------------------------------

create or replace function public.get_table_session_status(p_table_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select jsonb_build_object(
        'success', true,
        'table_number', t.table_number,
        'has_active_session', exists (
          select 1 from public.dining_sessions ds
          where ds.table_id = t.id and ds.status = 'open'
        )
      )
      from public.tables t
      where (
        t.slug = p_table_slug
        or (p_table_slug ~ '^table-[0-9]$' and t.slug = 'table-0' || substr(p_table_slug, 7))
        or (p_table_slug ~ '^table-0[0-9]$' and t.slug = 'table-' || substr(p_table_slug, 8))
      )
      and t.is_active = true
      limit 1
    ),
    jsonb_build_object('success', false)
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. Cashier order creation — stop the silent merge.
--
-- Verbatim from 0030 except for the one branch marked below. The explicit
-- p_dining_session_id path is untouched, so a deliberate "Gabung ke Sesi" still
-- attaches to the session the cashier chose.
--
-- The idempotent replay short-circuits above this block are unchanged, so a
-- retried or double-submitted order still returns its original row.
-- ---------------------------------------------------------------------------

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
      else
        -- BEHAVIOURAL CHANGE (the only one in this function). Previously this
        -- branch fell through and reused the open session, silently merging a
        -- new party into another party's bill. Joining is now an explicit act:
        -- the caller must pass p_dining_session_id.
        raise exception using errcode = '23514',
          message = 'Meja sedang terisi oleh sesi aktif. Pilih meja lain, atau gabung ke sesi secara eksplisit.';
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

-- ---------------------------------------------------------------------------
-- Permissions.
--
-- 0030 dropped start_or_resume_dining_session(text) and recreated it without
-- re-issuing the revoke, so that function currently carries PostgreSQL's default
-- PUBLIC EXECUTE. Re-applying 0027/0029's revoke-then-grant pair restores the
-- documented surface: PUBLIC gets nothing, anon and authenticated get exactly
-- what the flow needs.
--
-- create_cashier_order keeps its existing signature, so create or replace above
-- already preserved its ACL; the pair is restated so the intended surface is
-- explicit and the migration is safe to re-run.
-- ---------------------------------------------------------------------------

revoke all on function public.start_or_resume_dining_session(text, boolean) from public, anon, authenticated;
grant execute on function public.start_or_resume_dining_session(text, boolean) to anon, authenticated;

revoke all on function public.get_table_session_status(text) from public, anon, authenticated;
grant execute on function public.get_table_session_status(text) to anon, authenticated;

revoke all on function public.create_cashier_order(text, jsonb, uuid, text, text, public.fulfillment_type, uuid) from public, anon, authenticated;
grant execute on function public.create_cashier_order(text, jsonb, uuid, text, text, public.fulfillment_type, uuid) to authenticated;

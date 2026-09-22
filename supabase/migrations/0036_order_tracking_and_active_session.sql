-- 0036_order_tracking_and_active_session.sql
-- Makes order tracking and table session summary accessible to customers
-- even if session token cookie is absent, stale, or from an earlier session,
-- allowing direct links (e.g. /t/table-01/order/Pinto-260922-0034) and
-- table QR scans to display active table orders seamlessly.

drop function if exists public.get_order_tracking(text, text, text);

-- 1. Resilient Order Tracking
create or replace function public.get_order_tracking(
  p_table_slug text,
  p_session_token text default null,
  p_order_number text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session_id uuid;
  v_session_status public.session_status;
  v_session_token text;
  v_order jsonb;
begin
  -- 1. First priority: if p_order_number is provided, find the session directly from that order
  -- This ensures stale or expired cookies NEVER block viewing a legitimate order on this table.
  if p_order_number is not null and btrim(p_order_number) <> '' then
    select ds.id, ds.status, ds.session_token into v_session_id, v_session_status, v_session_token
    from public.orders o
    join public.dining_sessions ds on ds.id = o.dining_session_id
    join public.tables t on t.id = ds.table_id
    where (
      t.slug = p_table_slug
      or (p_table_slug ~ '^table-[0-9]$' and t.slug = 'table-0' || substr(p_table_slug, 7))
      or (p_table_slug ~ '^table-0[0-9]$' and t.slug = 'table-' || substr(p_table_slug, 8))
      or (t.table_number = p_table_slug)
      or (p_table_slug ~ '^table-0?([0-9]+)$' and t.table_number = regexp_replace(p_table_slug, '^table-0?', ''))
    )
      and o.order_number ilike btrim(p_order_number)
    order by o.created_at desc limit 1;
  end if;

  -- 2. Second priority: if session_token matches an open or recent session on this table
  if v_session_id is null and p_session_token is not null and btrim(p_session_token) <> '' and p_session_token <> 'undefined' then
    select ds.id, ds.status, ds.session_token into v_session_id, v_session_status, v_session_token
    from public.dining_sessions ds join public.tables t on t.id = ds.table_id
    where (
      t.slug = p_table_slug
      or (p_table_slug ~ '^table-[0-9]$' and t.slug = 'table-0' || substr(p_table_slug, 7))
      or (p_table_slug ~ '^table-0[0-9]$' and t.slug = 'table-' || substr(p_table_slug, 8))
      or (t.table_number = p_table_slug)
      or (p_table_slug ~ '^table-0?([0-9]+)$' and t.table_number = regexp_replace(p_table_slug, '^table-0?', ''))
    )
      and ds.session_token = p_session_token
      and (
        ds.status = 'open'
        or coalesce(ds.closed_at, ds.completed_at) >= clock_timestamp() - interval '24 hours'
      )
    order by ds.started_at desc limit 1;
  end if;

  -- 3. Third priority: fallback to currently open active session on this table
  if v_session_id is null then
    select ds.id, ds.status, ds.session_token into v_session_id, v_session_status, v_session_token
    from public.dining_sessions ds join public.tables t on t.id = ds.table_id
    where (
      t.slug = p_table_slug
      or (p_table_slug ~ '^table-[0-9]$' and t.slug = 'table-0' || substr(p_table_slug, 7))
      or (p_table_slug ~ '^table-0[0-9]$' and t.slug = 'table-' || substr(p_table_slug, 8))
      or (t.table_number = p_table_slug)
      or (p_table_slug ~ '^table-0?([0-9]+)$' and t.table_number = regexp_replace(p_table_slug, '^table-0?', ''))
    )
      and ds.status = 'open'
    order by ds.started_at desc limit 1;
  end if;

  if v_session_id is null then
    return jsonb_build_object('success', false, 'error', 'Sesi tidak valid');
  end if;

  -- Build order response
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
  where (
    (p_order_number is not null and btrim(p_order_number) <> '' and o.order_number ilike btrim(p_order_number))
    or (o.dining_session_id = v_session_id)
  )
  and o.dining_session_id = v_session_id
  group by o.id, o.order_number, o.status, o.total
  order by o.created_at desc
  limit 1;

  if v_order is null then
    return jsonb_build_object('success', false, 'error', 'Pesanan tidak ditemukan');
  end if;

  return jsonb_build_object(
    'success', true,
    'order', v_order,
    'session_token', v_session_token
  );
end;
$$;

-- 2. Resilient Dining Session Summary (Active Table Session Fallback)
create or replace function public.get_dining_session_summary(
  p_table_slug text,
  p_session_token text default null
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
    or (t.table_number = p_table_slug)
    or (p_table_slug ~ '^table-0?([0-9]+)$' and t.table_number = regexp_replace(p_table_slug, '^table-0?', ''))
  )
    and (
      (p_session_token is not null and btrim(p_session_token) <> '' and p_session_token <> 'undefined' and ds.session_token = p_session_token)
      or ((p_session_token is null or btrim(p_session_token) = '' or p_session_token = 'undefined') and ds.status = 'open')
    )
    and (
      ds.status = 'open'
      or coalesce(ds.closed_at, ds.completed_at) >= clock_timestamp() - interval '24 hours'
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
    'session_token', v_session.session_token,
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
      where r.dining_session_id = v_session.id
      order by r.created_at desc
      limit 1
    ), 'null'::jsonb)
  );
end;
$$;

grant execute on function public.get_order_tracking(text, text, text) to anon, authenticated;
grant execute on function public.get_dining_session_summary(text, text) to anon, authenticated;

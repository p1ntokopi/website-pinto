-- 0017_dining_anon_access.sql
-- Anonymous customers (scan QR, no login) need to validate their dining session
-- and read their own order. dining_sessions and orders have no public RLS
-- policies, so these security definer functions bridge the gap without opening
-- RLS to the anon role.

create or replace function public.validate_dining_session(
  p_table_slug text,
  p_session_token text
) returns jsonb as $$
declare
  v_table_id uuid;
  v_session_id uuid;
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

  return jsonb_build_object('success', true, 'session_id', v_session_id);
end;
$$ language plpgsql security definer set search_path = public;

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
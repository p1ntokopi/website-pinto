-- 0028_p1nto_session_finance.sql
-- Financial summary v3: one deterministic PAID event per bill target handles
-- both direct order payments and dining-session payments. A session bill takes
-- precedence over direct payments attached to its underlying orders.

create or replace function public.get_financial_summary(p_start date, p_end date)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
  if not public.is_owner() then
    raise exception using errcode = '42501', message = 'Hanya owner yang dapat mengakses data keuangan.';
  end if;
  if p_start is null or p_end is null then
    raise exception using errcode = '22023', message = 'Rentang tanggal wajib diisi.';
  end if;
  if p_end < p_start then raise exception 'Rentang tanggal tidak valid: tanggal akhir sebelum tanggal mulai.'; end if;
  -- Inclusive dates = difference + 1, so 366 inclusive dates cap at diff 365.
  if (p_end - p_start) > 365 then raise exception 'Rentang maksimal 366 hari.'; end if;

  with paid_candidates as (
    select p.id, p.order_id, p.dining_session_id, p.amount,
      coalesce(nullif(p.payment_method, ''), p.provider) as method,
      coalesce(p.paid_at, p.created_at) as paid_at
    from public.payments p
    where p.status = 'PAID'
  ),
  ranked_paid as (
    select pc.*,
      row_number() over (
        partition by coalesce('session:' || pc.dining_session_id::text,
                              'order:' || pc.order_id::text)
        order by pc.paid_at desc, pc.id desc
      ) as target_rank
    from paid_candidates pc
  ),
  canonical_paid_all as (
    select rp.id, rp.order_id, rp.dining_session_id, rp.amount,
      rp.method, rp.paid_at
    from ranked_paid rp
    where rp.target_rank = 1
      and (
        rp.dining_session_id is not null
        or not exists (
          select 1
          from public.orders target_order
          join ranked_paid session_bill
            on session_bill.dining_session_id = target_order.dining_session_id
           and session_bill.target_rank = 1
          where target_order.id = rp.order_id
        )
      )
  ),
  canonical_paid as (
    select *
    from canonical_paid_all
    where (paid_at at time zone 'Asia/Jakarta')::date between p_start and p_end
  ),
  payment_order as (
    select cp.id as payment_id, o.id as order_id, cp.paid_at,
      case when cp.order_id is not null then cp.amount
           else round(cp.amount * o.total / nullif(sum(o.total) over (partition by cp.id), 0), 2)
      end as allocated_revenue
    from canonical_paid cp
    join public.orders o on o.id = cp.order_id
      or (cp.dining_session_id is not null
          and o.dining_session_id = cp.dining_session_id
          -- Session bills exclude orders cancelled before payment; finance must match.
          and o.status <> 'CANCELLED')
  ),
  paid_orders as (
    select order_id, payment_id, paid_at, allocated_revenue
    from payment_order
  ),
  sales as (
    select count(*)::int as paid_order_count,
      coalesce(sum(o.total), 0)::numeric as gross,
      coalesce(sum(o.discount), 0)::numeric as discount,
      coalesce(sum(o.tax), 0)::numeric as tax,
      coalesce(sum(o.service_fee), 0)::numeric as service_fee,
      coalesce(sum(o.shipping_fee), 0)::numeric as shipping_fee
    from public.orders o join paid_orders po on po.order_id = o.id
  ),
  adjustments as (
    select coalesce(sum(amount) filter (where adjustment_type = 'REFUND'), 0)::numeric as refund_total,
      coalesce(count(*) filter (where adjustment_type = 'REFUND'), 0)::int as refund_count,
      coalesce(sum(amount) filter (where adjustment_type = 'CORRECTION'), 0)::numeric as correction_total
    from public.financial_adjustments where status = 'ACTIVE' and effective_date between p_start and p_end
  ),
  expense_totals as (
    select coalesce(sum(amount), 0)::numeric as total, count(*)::int as count
    from public.expenses where status = 'ACTIVE' and expense_date between p_start and p_end
  ),
  expense_by_category as (
    select c.name as category, sum(e.amount)::numeric as total, count(*)::int as count
    from public.expenses e join public.expense_categories c on c.id = e.category_id
    where e.status = 'ACTIVE' and e.expense_date between p_start and p_end group by c.name
  ),
  payment_breakdown as (
    select method, sum(amount)::numeric as total, count(*)::int as tx_count
    from canonical_paid group by method
  ),
  revenue_by_day as (
    select (paid_at at time zone 'Asia/Jakarta')::date as day,
      sum(amount)::numeric as revenue from canonical_paid group by 1
  ),
  orders_by_day as (
    select (created_at at time zone 'Asia/Jakarta')::date as day, count(*)::int as order_count
    from public.orders where (created_at at time zone 'Asia/Jakarta')::date between p_start and p_end group by 1
  ),
  revenue_series as (
    select d::date as day, coalesce(r.revenue, 0)::numeric as revenue
    from generate_series(p_start, p_end, interval '1 day') d left join revenue_by_day r on r.day = d::date
  ),
  orders_series as (
    select d::date as day, coalesce(o.order_count, 0)::int as order_count
    from generate_series(p_start, p_end, interval '1 day') d left join orders_by_day o on o.day = d::date
  ),
  product_sales as (
    select oi.product_name_snapshot as name, coalesce(c.name, 'Lainnya') as category,
      coalesce(pr.product_type, pr2.product_type) as product_type,
      sum(oi.quantity)::int as units, sum(oi.subtotal)::numeric as revenue,
      (sum(oi.subtotal) / nullif(sum(oi.quantity), 0))::numeric as avg_price
    from public.order_items oi join paid_orders po on po.order_id = oi.order_id
    left join public.products pr on pr.id = oi.product_id
    left join public.coffee_variants cv on cv.id = oi.coffee_variant_id
    left join public.coffee_products cp on cp.id = cv.coffee_product_id
    left join public.products pr2 on pr2.id = cp.product_id
    left join public.categories c on c.id = coalesce(pr.category_id, pr2.category_id)
    group by 1, 2, 3
  ),
  top_products as (
    select name, category, units, revenue, avg_price from product_sales
    order by units desc, revenue desc limit 50
  ),
  category_performance as (
    select category, sum(units)::int as units, sum(revenue)::numeric as revenue
    from product_sales group by category
  ),
  beans as (
    select b.units, b.revenue, (b.revenue / nullif(b.units, 0))::numeric as avg_price,
      (select name from product_sales where product_type = 'COFFEE_BEAN' order by units desc, revenue desc limit 1) as top_product
    from (select coalesce(sum(units), 0)::int as units,
      coalesce(sum(revenue), 0)::numeric as revenue from product_sales where product_type = 'COFFEE_BEAN') b
  ),
  order_reconciliation as (
    select count(*)::int as total,
      count(*) filter (where o.status = 'CANCELLED')::int as cancelled,
      count(*) filter (where o.status <> 'CANCELLED' and exists (
        select 1 from public.orders paid_order
        join canonical_paid_all cp
          on cp.order_id = paid_order.id
          or (cp.dining_session_id = paid_order.dining_session_id
              and paid_order.status <> 'CANCELLED')
        where paid_order.id = o.id
      ))::int as paid,
      count(*) filter (where o.status <> 'CANCELLED' and not exists (
        select 1 from public.orders paid_order
        join canonical_paid_all cp
          on cp.order_id = paid_order.id
          or (cp.dining_session_id = paid_order.dining_session_id
              and paid_order.status <> 'CANCELLED')
        where paid_order.id = o.id
      ))::int as unpaid,
      count(*) filter (where o.status = 'PENDING_PAYMENT')::int as pending_payment
    from public.orders o
    where (o.created_at at time zone 'Asia/Jakarta')::date between p_start and p_end
  ),
  cash_in as (
    select coalesce(sum(amount), 0)::numeric as total from canonical_paid where method = 'CASH'
  ),
  cash_out as (
    select coalesce(sum(amount), 0)::numeric as total from public.expenses
    where status = 'ACTIVE' and payment_method = 'CASH' and expense_date between p_start and p_end
  )
  select jsonb_build_object(
    'period', jsonb_build_object('start', p_start, 'end', p_end),
    'sales', (select to_jsonb(s) from sales s),
    'refund', (select jsonb_build_object('total', refund_total, 'count', refund_count) from adjustments),
    'adjustment', (select jsonb_build_object('total', correction_total) from adjustments),
    'expense', jsonb_build_object('total', (select total from expense_totals),
      'count', (select count from expense_totals),
      'avg_daily', (select total / greatest(p_end - p_start + 1, 1) from expense_totals)),
    'expense_by_category', (select coalesce(jsonb_agg(to_jsonb(x) order by x.total desc), '[]'::jsonb) from expense_by_category x),
    'payment_breakdown', (select coalesce(jsonb_agg(to_jsonb(x) order by x.total desc), '[]'::jsonb) from payment_breakdown x),
    'revenue_series', (select coalesce(jsonb_agg(to_jsonb(x) order by x.day), '[]'::jsonb) from revenue_series x),
    'orders_series', (select coalesce(jsonb_agg(to_jsonb(x) order by x.day), '[]'::jsonb) from orders_series x),
    'top_products', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from top_products x),
    'category_performance', (select coalesce(jsonb_agg(to_jsonb(x) order by x.revenue desc), '[]'::jsonb) from category_performance x),
    'beans', (select to_jsonb(x) from beans x),
    'order_reconciliation', (select to_jsonb(x) from order_reconciliation x),
    'cash_flow', jsonb_build_object('in', (select total from cash_in),
      'out', (select total from cash_out),
      'net', (select total from cash_in) - (select total from cash_out))
  ) into v_result;
  return v_result;
end;
$$;

-- Operational dashboard revenue uses the same all-time canonical target choice
-- as owner finance, then applies an exclusive timestamp range to that stream.
create or replace function public.get_realized_revenue(
  p_start timestamptz,
  p_end timestamptz
) returns numeric
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_total numeric;
begin
  if not public.is_staff() then
    raise exception using errcode = '42501', message = 'Operational access required';
  end if;
  if p_start is null or p_end is null then
    raise exception using errcode = '22023', message = 'Invalid realized revenue range';
  end if;
  if p_end <= p_start or p_end - p_start > interval '32 days' then
    raise exception using errcode = '22023', message = 'Invalid realized revenue range';
  end if;

  with paid_candidates as (
    select p.id, p.order_id, p.dining_session_id, p.amount,
      coalesce(p.paid_at, p.created_at) as paid_at
    from public.payments p
    where p.status = 'PAID'
  ),
  ranked_paid as (
    select pc.*,
      row_number() over (
        partition by coalesce('session:' || pc.dining_session_id::text,
                              'order:' || pc.order_id::text)
        order by pc.paid_at desc, pc.id desc
      ) as target_rank
    from paid_candidates pc
  ),
  canonical_paid as (
    select rp.*
    from ranked_paid rp
    where rp.target_rank = 1
      and (
        rp.dining_session_id is not null
        or not exists (
          select 1
          from public.orders target_order
          join ranked_paid session_bill
            on session_bill.dining_session_id = target_order.dining_session_id
           and session_bill.target_rank = 1
          where target_order.id = rp.order_id
        )
      )
  )
  select coalesce(sum(amount), 0)::numeric into v_total
  from canonical_paid
  where paid_at >= p_start and paid_at < p_end;

  return v_total;
end;
$$;

revoke all on function public.get_financial_summary(date, date) from public, anon, authenticated;
grant execute on function public.get_financial_summary(date, date) to authenticated;
revoke all on function public.get_realized_revenue(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.get_realized_revenue(timestamptz, timestamptz) to authenticated;

-- 0022_finance_rpc.sql
-- get_financial_summary(p_start, p_end) — the single source of truth for every
-- financial page. All aggregation happens in SQL so the browser never pulls
-- thousands of rows just to compute totals.
--
-- Financial definitions (applied consistently everywhere):
--   Realized revenue : Σ payments.amount WHERE status='PAID', dated by
--                      coalesce(paid_at, created_at) in Asia/Jakarta, order
--                      not CANCELLED (cash basis).
--   Gross sales      : Σ orders.total of the same revenue orders.
--   Net sales        : gross - discount - refund + corrections.
--   Expenses         : Σ expenses.amount WHERE status='ACTIVE' by expense_date.
--   Estimasi laba    : net sales - expenses (NO COGS yet — always an estimate).
--   Cash flow        : cash-in = PAID payments via CASH channel;
--                      cash-out = expenses paid in CASH.
--
-- SECURITY DEFINER + explicit is_owner() check: admin/staff/anon get an
-- exception, never data.

create or replace function public.get_financial_summary(p_start date, p_end date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not is_owner() then
    raise exception 'Hanya owner yang dapat mengakses data keuangan.';
  end if;
  if p_end < p_start then
    raise exception 'Rentang tanggal tidak valid: tanggal akhir sebelum tanggal mulai.';
  end if;
  if (p_end - p_start) > 366 then
    raise exception 'Rentang maksimal 366 hari.';
  end if;

  with paid_orders as (
    select distinct o.id
    from public.orders o
    join public.payments p on p.order_id = o.id
    where p.status = 'PAID'
      and o.status <> 'CANCELLED'
      and (coalesce(p.paid_at, p.created_at) at time zone 'Asia/Jakarta')::date between p_start and p_end
  ),
  sales as (
    select
      count(*)::int as paid_order_count,
      coalesce(sum(o.total), 0)::numeric as gross,
      coalesce(sum(o.discount), 0)::numeric as discount,
      coalesce(sum(o.tax), 0)::numeric as tax,
      coalesce(sum(o.service_fee), 0)::numeric as service_fee,
      coalesce(sum(o.shipping_fee), 0)::numeric as shipping_fee
    from public.orders o
    join paid_orders po on po.id = o.id
  ),
  adjustments as (
    select
      coalesce(sum(amount) filter (where adjustment_type = 'REFUND'), 0)::numeric as refund_total,
      coalesce(count(*) filter (where adjustment_type = 'REFUND'), 0)::int as refund_count,
      coalesce(sum(amount) filter (where adjustment_type = 'CORRECTION'), 0)::numeric as correction_total
    from public.financial_adjustments
    where status = 'ACTIVE' and effective_date between p_start and p_end
  ),
  expense_totals as (
    select coalesce(sum(e.amount), 0)::numeric as total, count(*)::int as count
    from public.expenses e
    where e.status = 'ACTIVE' and e.expense_date between p_start and p_end
  ),
  expense_by_category as (
    select c.name as category, sum(e.amount)::numeric as total, count(*)::int as count
    from public.expenses e
    join public.expense_categories c on c.id = e.category_id
    where e.status = 'ACTIVE' and e.expense_date between p_start and p_end
    group by c.name
  ),
  payment_breakdown as (
    select
      coalesce(nullif(p.payment_method, ''), p.provider) as method,
      sum(p.amount)::numeric as total,
      count(*)::int as tx_count
    from public.payments p
    join public.orders o on o.id = p.order_id
    where p.status = 'PAID'
      and o.status <> 'CANCELLED'
      and (coalesce(p.paid_at, p.created_at) at time zone 'Asia/Jakarta')::date between p_start and p_end
    group by 1
  ),
  revenue_by_day as (
    select
      (coalesce(p.paid_at, p.created_at) at time zone 'Asia/Jakarta')::date as day,
      sum(p.amount)::numeric as revenue
    from public.payments p
    join public.orders o on o.id = p.order_id
    where p.status = 'PAID'
      and o.status <> 'CANCELLED'
      and (coalesce(p.paid_at, p.created_at) at time zone 'Asia/Jakarta')::date between p_start and p_end
    group by 1
  ),
  orders_by_day as (
    select
      (o.created_at at time zone 'Asia/Jakarta')::date as day,
      count(*)::int as order_count
    from public.orders o
    where (o.created_at at time zone 'Asia/Jakarta')::date between p_start and p_end
    group by 1
  ),
  revenue_series as (
    select d::date as day, coalesce(r.revenue, 0)::numeric as revenue
    from generate_series(p_start, p_end, interval '1 day') d
    left join revenue_by_day r on r.day = d::date
  ),
  orders_series as (
    select d::date as day, coalesce(od.order_count, 0)::int as order_count
    from generate_series(p_start, p_end, interval '1 day') d
    left join orders_by_day od on od.day = d::date
  ),
  product_sales as (
    select
      oi.product_name_snapshot as name,
      coalesce(c.name, 'Lainnya') as category,
      coalesce(pr.product_type, pr2.product_type) as product_type,
      sum(oi.quantity)::int as units,
      sum(oi.subtotal)::numeric as revenue,
      (sum(oi.subtotal) / nullif(sum(oi.quantity), 0))::numeric as avg_price
    from public.order_items oi
    join paid_orders po on po.id = oi.order_id
    left join public.products pr on pr.id = oi.product_id
    left join public.coffee_variants cv on cv.id = oi.coffee_variant_id
    left join public.coffee_products cp on cp.id = cv.coffee_product_id
    left join public.products pr2 on pr2.id = cp.product_id
    left join public.categories c on c.id = coalesce(pr.category_id, pr2.category_id)
    group by 1, 2, 3
  ),
  top_products as (
    select name, category, units, revenue, avg_price
    from product_sales
    order by units desc, revenue desc
    limit 50
  ),
  category_performance as (
    select category, sum(units)::int as units, sum(revenue)::numeric as revenue
    from product_sales
    group by category
  ),
  beans as (
    select
      coalesce(sum(units), 0)::int as units,
      coalesce(sum(revenue), 0)::numeric as revenue,
      (revenue / nullif(units, 0))::numeric as avg_price,
      (select name from product_sales where product_type = 'COFFEE_BEAN' order by units desc, revenue desc limit 1) as top_product
    from product_sales
    where product_type = 'COFFEE_BEAN'
  ),
  order_reconciliation as (
    select
      count(*)::int as total,
      count(*) filter (where o.status = 'CANCELLED')::int as cancelled,
      count(*) filter (where o.status <> 'CANCELLED' and exists (
        select 1 from public.payments p where p.order_id = o.id and p.status = 'PAID'
      ))::int as paid,
      count(*) filter (where o.status <> 'CANCELLED' and not exists (
        select 1 from public.payments p where p.order_id = o.id and p.status = 'PAID'
      ))::int as unpaid,
      count(*) filter (where o.status = 'PENDING_PAYMENT')::int as pending_payment
    from public.orders o
    where (o.created_at at time zone 'Asia/Jakarta')::date between p_start and p_end
  ),
  cash_in as (
    select coalesce(sum(p.amount), 0)::numeric as total
    from public.payments p
    join public.orders o on o.id = p.order_id
    where p.status = 'PAID'
      and o.status <> 'CANCELLED'
      and coalesce(nullif(p.payment_method, ''), p.provider) = 'CASH'
      and (coalesce(p.paid_at, p.created_at) at time zone 'Asia/Jakarta')::date between p_start and p_end
  ),
  cash_out as (
    select coalesce(sum(e.amount), 0)::numeric as total
    from public.expenses e
    where e.status = 'ACTIVE'
      and e.payment_method = 'CASH'
      and e.expense_date between p_start and p_end
  )
  select jsonb_build_object(
    'period', jsonb_build_object('start', p_start, 'end', p_end),
    'sales', (select to_jsonb(s) from sales s),
    'refund', (
      select jsonb_build_object('total', a.refund_total, 'count', a.refund_count)
      from adjustments a
    ),
    'adjustment', (
      select jsonb_build_object('total', a.correction_total)
      from adjustments a
    ),
    'expense', jsonb_build_object(
      'total', (select total from expense_totals),
      'count', (select count from expense_totals),
      'avg_daily', (select total / greatest(p_end - p_start + 1, 1) from expense_totals)
    ),
    'expense_by_category', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.total desc), '[]'::jsonb)
      from expense_by_category x
    ),
    'payment_breakdown', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.total desc), '[]'::jsonb)
      from payment_breakdown x
    ),
    'revenue_series', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.day), '[]'::jsonb)
      from revenue_series x
    ),
    'orders_series', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.day), '[]'::jsonb)
      from orders_series x
    ),
    'top_products', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from top_products x),
    'category_performance', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.revenue desc), '[]'::jsonb)
      from category_performance x
    ),
    'beans', (select to_jsonb(b) from beans b),
    'order_reconciliation', (select to_jsonb(r) from order_reconciliation r),
    'cash_flow', jsonb_build_object(
      'in', (select total from cash_in),
      'out', (select total from cash_out),
      'net', ((select total from cash_in) - (select total from cash_out))
    )
  ) into v_result;

  return v_result;
end;
$$;

-- 0025_p1nto_manual_cashier.sql
-- Approved P1NTO manual cashier workflow. Additive only: existing Xendit rows
-- and legacy order/payment states remain valid and untouched.

-- Production preflight (READ ONLY; run before applying this migration):
-- select enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid
-- where t.typnamespace = 'public'::regnamespace
--   and t.typname in ('order_status', 'order_type', 'fulfillment_type', 'payment_status')
-- order by t.typname, e.enumsortorder;
-- select count(*) filter (where order_id is null) as payment_without_order,
--        count(*) filter (where provider = 'XENDIT') as xendit_payments
-- from public.payments;
-- select order_number, count(*) from public.orders group by order_number having count(*) > 1;
-- select client_request_id, count(*) from public.orders
-- where client_request_id is not null group by client_request_id having count(*) > 1;
-- select ds.id, ds.status, count(o.id) as orders,
--        coalesce(sum(o.total) filter (where o.status <> 'CANCELLED'), 0) as session_total
-- from public.dining_sessions ds left join public.orders o on o.dining_session_id = ds.id
-- group by ds.id, ds.status order by ds.started_at desc limit 100;

-- Keep every historical value and append the approved lifecycle/order values.
-- 0026+ references these labels, so both enum changes live in this earlier file.
alter type public.order_status add value if not exists 'NEW' after 'PENDING_PAYMENT';
alter type public.order_status add value if not exists 'SERVED' after 'READY';
alter type public.order_type add value if not exists 'TAKEAWAY' after 'DINE_IN';

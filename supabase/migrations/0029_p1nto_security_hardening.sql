-- 0029_p1nto_security_hardening.sql
-- Forward-only hardening of legacy SECURITY DEFINER functions that predate
-- 0026/0027. New migrations already revoke PUBLIC and grant narrowly; older
-- functions were created with default PUBLIC EXECUTE, so any authenticated or
-- anonymous client could invoke them directly even when the function body is
-- safe. Revoking EXECUTE closes that surface and keeps RLS policies working —
-- policies evaluate helper functions as the calling role with EXECUTE granted
-- through the explicit grants below.
--
-- Trigger-only functions gain an internal caller guard instead of a role grant:
-- PostgreSQL fires triggers regardless of EXECUTE privileges on the function,
-- but revoking PUBLIC still prevents any direct CALL from a client connection.

-- ---------------------------------------------------------------------------
-- 1. Trigger-only audit functions (0021): revoke PUBLIC EXECUTE. The triggers
--    on expenses/financial_adjustments keep firing for authorized writers.
-- ---------------------------------------------------------------------------

revoke all on function public.audit_expense_change() from public, anon, authenticated;
revoke all on function public.audit_adjustment_change() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Auth-profile trigger (0002): fires on auth.users inserts (supabase_auth_admin).
--    No client should call it directly.
-- ---------------------------------------------------------------------------

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Role helper functions used inside RLS policies and RPC authorization.
--    Policies run with the caller's privileges, so anon/authenticated need
--    EXECUTE on helpers referenced by policies they exercise.
-- ---------------------------------------------------------------------------

-- is_admin/is_staff/is_kitchen/is_owner are referenced by RLS policies on
-- operational tables (anon reads menus/tables; authenticated staff writes) and
-- inside SECURITY DEFINER RPC bodies.
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.is_kitchen() to anon, authenticated;
grant execute on function public.is_owner() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Legacy customer-session RPCs (0016/0017/0019). 0027 re-creates the
--    current signatures with fixed search paths and explicit grants; these
--    statements cover the historical signatures that may still exist if a
--    project last migrated before 0027, and are harmless no-ops otherwise
--    (functions replaced by 0027 keep their grants from there).
-- ---------------------------------------------------------------------------

revoke all on function public.start_or_resume_dining_session(text)
  from public;
grant execute on function public.start_or_resume_dining_session(text)
  to anon, authenticated;

revoke all on function public.validate_dining_session(text, text)
  from public;
grant execute on function public.validate_dining_session(text, text)
  to anon, authenticated;

revoke all on function public.get_order_tracking(text, text, text)
  from public;
grant execute on function public.get_order_tracking(text, text, text)
  to anon, authenticated;

revoke all on function public.create_customer_order(text, text, text, text, jsonb)
  from public;
grant execute on function public.create_customer_order(text, text, text, text, jsonb)
  to anon, authenticated;

-- record_order_payment is webhook-only (service_role). PUBLIC keeps no EXECUTE.
revoke all on function public.record_order_payment(
  uuid, text, text, numeric, public.payment_status, timestamptz, jsonb,
  text, text, text, text, text, text, timestamptz, timestamptz
) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Legacy customer order signature (0011, replaced in 0018). Only the
--    (text, text, text, text, jsonb) signature remains after 0018's drop and
--    re-create, so there is no separate legacy cashier function to revoke.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 6. Finance RPCs (0022/0024/0028 re-create them with grants). Cover the
--    case where only the 0022 signature exists (upgrade path from 0021).
-- ---------------------------------------------------------------------------

revoke all on function public.get_financial_summary(date, date)
  from public, anon, authenticated;
grant execute on function public.get_financial_summary(date, date)
  to authenticated;

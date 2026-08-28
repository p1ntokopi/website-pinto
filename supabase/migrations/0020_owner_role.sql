-- 0020_owner_role.sql
-- Adds the OWNER role. The owner outranks admin: they get every operational
-- capability plus exclusive access to the financial area (expenses,
-- adjustments, financial reports) enforced via RLS.
--
-- IMPORTANT: ALTER TYPE ... ADD VALUE must be the only statement touching the
-- enum in this transaction — the new value is referenced by 0021+ instead.

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'owner' AFTER 'admin';

-- ============================================================
-- Assign the owner role (run manually after this migration,
-- e.g. in the Supabase SQL editor — replace the email first):
--
-- UPDATE public.profiles
-- SET role = 'owner'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'ganti-dengan-email-owner@example.com');
-- ============================================================

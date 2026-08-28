-- 0021_finance_schema.sql
-- Owner-only financial tables: expense categories, expenses, and financial
-- adjustments (refunds / manual corrections). Soft-delete only (ACTIVE/VOIDED)
-- so financial history stays auditable. Every change is recorded into the
-- existing audit_logs table via triggers.
--
-- RLS: only the OWNER role gets policies on these tables. Admin/staff/kitchen
-- are denied by default — even direct Supabase API calls fail.
--
-- Requires 0020_owner_role.sql (the 'owner' enum value).

-- ---------------------------------------------------------------------------
-- Role helpers: owner is a superset of admin; is_owner() is strictly owner.
-- ---------------------------------------------------------------------------

create or replace function public.is_owner()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  );
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'owner')
  );
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.is_kitchen()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'owner', 'kitchen')
  );
end;
$$ language plpgsql security definer set search_path = public;

-- ---------------------------------------------------------------------------
-- Expense categories (database-driven, configurable — not hard-coded)
-- ---------------------------------------------------------------------------

create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Expenses
-- ---------------------------------------------------------------------------

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  amount numeric(12,2) not null check (amount >= 0),
  category_id uuid not null references public.expense_categories(id) on delete restrict,
  expense_date date not null,
  payment_method text not null default 'CASH' check (payment_method in ('CASH','TRANSFER','EWALLET','OTHER')),
  attachment_url text,
  notes text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','VOIDED')),
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  voided_at timestamptz,
  voided_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_expenses_expense_date on public.expenses (expense_date);
create index if not exists idx_expenses_status on public.expenses (status);
create index if not exists idx_expenses_category_id on public.expenses (category_id);
create index if not exists idx_expenses_created_by on public.expenses (created_by);

-- ---------------------------------------------------------------------------
-- Financial adjustments (refunds & manual corrections)
-- ---------------------------------------------------------------------------

create table if not exists public.financial_adjustments (
  id uuid primary key default gen_random_uuid(),
  adjustment_type text not null check (adjustment_type in ('REFUND','CORRECTION')),
  amount numeric(12,2) not null check (amount <> 0),
  order_id uuid references public.orders(id) on delete set null,
  effective_date date not null default current_date,
  reason text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','VOIDED')),
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  voided_at timestamptz,
  voided_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_financial_adjustments_effective_date
  on public.financial_adjustments (effective_date);
create index if not exists idx_financial_adjustments_status
  on public.financial_adjustments (status);
create index if not exists idx_financial_adjustments_order_id
  on public.financial_adjustments (order_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers (reuse 0008 helper)
-- ---------------------------------------------------------------------------

drop trigger if exists set_expense_categories_updated_at on public.expense_categories;
create trigger set_expense_categories_updated_at
  before update on public.expense_categories
  for each row execute function public.update_updated_at();

drop trigger if exists set_expenses_updated_at on public.expenses;
create trigger set_expenses_updated_at
  before update on public.expenses
  for each row execute function public.update_updated_at();

drop trigger if exists set_financial_adjustments_updated_at on public.financial_adjustments;
create trigger set_financial_adjustments_updated_at
  before update on public.financial_adjustments
  for each row execute function public.update_updated_at();

-- ---------------------------------------------------------------------------
-- Audit trail (writes into existing audit_logs)
-- ---------------------------------------------------------------------------

create or replace function public.audit_expense_change()
returns trigger as $$
declare
  v_action text;
begin
  if tg_op = 'INSERT' then
    v_action := 'expense.created';
  elsif tg_op = 'UPDATE' and new.status = 'VOIDED' and coalesce(old.status, '') <> 'VOIDED' then
    v_action := 'expense.voided';
  elsif tg_op = 'UPDATE' then
    v_action := 'expense.updated';
  else
    return coalesce(new, old);
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    v_action,
    'expenses',
    new.id,
    jsonb_build_object(
      'title', new.title,
      'amount', new.amount,
      'expense_date', new.expense_date,
      'payment_method', new.payment_method,
      'status', new.status
    )
  );
  return coalesce(new, old);
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists audit_expenses on public.expenses;
create trigger audit_expenses
  after insert or update on public.expenses
  for each row execute function public.audit_expense_change();

create or replace function public.audit_adjustment_change()
returns trigger as $$
declare
  v_action text;
begin
  if tg_op = 'INSERT' then
    v_action := 'adjustment.created';
  elsif tg_op = 'UPDATE' and new.status = 'VOIDED' and coalesce(old.status, '') <> 'VOIDED' then
    v_action := 'adjustment.voided';
  elsif tg_op = 'UPDATE' then
    v_action := 'adjustment.updated';
  else
    return coalesce(new, old);
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    v_action,
    'financial_adjustments',
    new.id,
    jsonb_build_object(
      'adjustment_type', new.adjustment_type,
      'amount', new.amount,
      'effective_date', new.effective_date,
      'status', new.status
    )
  );
  return coalesce(new, old);
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists audit_financial_adjustments on public.financial_adjustments;
create trigger audit_financial_adjustments
  after insert or update on public.financial_adjustments
  for each row execute function public.audit_adjustment_change();

-- ---------------------------------------------------------------------------
-- RLS — owner only. No policies for admin/staff/kitchen: default deny.
-- ---------------------------------------------------------------------------

alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.financial_adjustments enable row level security;

drop policy if exists "Owner full access expense_categories" on public.expense_categories;
create policy "Owner full access expense_categories"
  on public.expense_categories for all
  using (is_owner()) with check (is_owner());

drop policy if exists "Owner full access expenses" on public.expenses;
create policy "Owner full access expenses"
  on public.expenses for all
  using (is_owner()) with check (is_owner());

drop policy if exists "Owner full access financial_adjustments" on public.financial_adjustments;
create policy "Owner full access financial_adjustments"
  on public.financial_adjustments for all
  using (is_owner()) with check (is_owner());

-- Owner can read and write the audit trail for financial entities.
drop policy if exists "Owner read audit_logs" on public.audit_logs;
create policy "Owner read audit_logs"
  on public.audit_logs for select
  using (is_owner());

drop policy if exists "Owner insert audit_logs" on public.audit_logs;
create policy "Owner insert audit_logs"
  on public.audit_logs for insert
  with check (is_owner());

-- ---------------------------------------------------------------------------
-- Seed expense categories (idempotent)
-- ---------------------------------------------------------------------------

insert into public.expense_categories (name, sort_order) values
  ('Operational', 1),
  ('Ingredients', 2),
  ('Coffee Beans', 3),
  ('Milk', 4),
  ('Food Ingredients', 5),
  ('Packaging', 6),
  ('Utilities', 7),
  ('Rent', 8),
  ('Internet', 9),
  ('Equipment', 10),
  ('Maintenance', 11),
  ('Marketing', 12),
  ('Employee', 13),
  ('Transportation', 14),
  ('Other', 15)
on conflict (name) do nothing;

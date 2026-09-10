-- 0026_p1nto_manual_cashier_schema.sql
-- Schema, constraints, indexes, RLS, and immutable receipt records.
-- This is separate from 0025 because PostgreSQL cannot safely use freshly added
-- enum labels in the same migration transaction.

alter table public.orders
  add column if not exists source text,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists request_fingerprint text;

update public.orders
set source = case when client_request_id is not null then 'CUSTOMER' else 'LEGACY' end
where source is null;

alter table public.orders
  alter column source set default 'CUSTOMER',
  alter column source set not null;

alter table public.orders drop constraint if exists orders_request_fingerprint_check;
alter table public.orders
  add constraint orders_request_fingerprint_check check (
    request_fingerprint is null or request_fingerprint ~ '^[0-9a-f]{64}$'
  );

create unique index if not exists orders_client_request_id_key
  on public.orders(client_request_id)
  where client_request_id is not null;

alter table public.orders drop constraint if exists orders_source_check;
alter table public.orders
  add constraint orders_source_check check (source in ('CUSTOMER', 'CASHIER', 'LEGACY'));

-- owner is an operational super-role. Keeping the helper centralized prevents
-- owner rows from disappearing behind policies that call is_staff().
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true
      and role in ('admin', 'owner', 'staff')
  )
$$;

create or replace function public.is_kitchen()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true
      and role in ('admin', 'owner', 'kitchen')
  )
$$;

-- A sequence-backed suffix removes the random/count race while retaining the
-- existing Pinto-YYMMDD-XXXX presentation (the suffix may grow beyond 4 digits).
create sequence if not exists public.order_number_seq;
-- Start above every numeric historical suffix. On reruns, advance past an
-- already-called sequence value; an uncalled sequence may safely emit last_value.
do $$
declare
  v_historical_next bigint;
  v_sequence_next bigint;
begin
  select coalesce(max((regexp_match(order_number,
    '^Pinto-[0-9]{6}-([0-9]+)$'))[1]::bigint), 0) + 1
  into v_historical_next
  from public.orders
  where order_number ~ '^Pinto-[0-9]{6}-[0-9]+$';

  select case when is_called then last_value + 1 else last_value end
  into v_sequence_next
  from public.order_number_seq;

  perform setval(
    'public.order_number_seq',
    greatest(v_historical_next, v_sequence_next),
    false
  );
end;
$$;

alter table public.dining_sessions
  add column if not exists completed_by uuid references public.profiles(id) on delete set null,
  add column if not exists completion_idempotency_key text,
  add column if not exists total_snapshot numeric(12,2),
  add column if not exists receipt_snapshot jsonb,
  add column if not exists completed_at timestamptz;

create unique index if not exists dining_sessions_completion_idempotency_key_key
  on public.dining_sessions(completion_idempotency_key)
  where completion_idempotency_key is not null;

-- Preserve every Xendit column and row. order_id becomes optional only so one
-- payment can target exactly one order OR one dining session.
alter table public.payments
  add column if not exists dining_session_id uuid references public.dining_sessions(id) on delete restrict,
  add column if not exists cashier_id uuid references public.profiles(id) on delete restrict,
  add column if not exists cashier_metadata jsonb,
  add column if not exists idempotency_key text,
  add column if not exists payment_origin text,
  add column if not exists confirmed_by uuid references public.profiles(id) on delete restrict,
  add column if not exists confirmed_at timestamptz,
  add column if not exists cash_received numeric(12,2),
  add column if not exists change_amount numeric(12,2),
  alter column order_id drop not null;

update public.payments
set payment_origin = case
  when provider = 'XENDIT' then 'XENDIT'
  when provider = 'MANUAL' then 'LEGACY_MANUAL'
  else 'PROVIDER'
end
where payment_origin is null;

alter table public.payments
  alter column payment_origin set default 'PROVIDER',
  alter column payment_origin set not null;
alter table public.payments drop constraint if exists payments_origin_check;
alter table public.payments add constraint payments_origin_check
  check (payment_origin in ('XENDIT', 'PROVIDER', 'LEGACY_MANUAL', 'CASHIER'));

alter table public.payments drop constraint if exists payments_exactly_one_target_check;
alter table public.payments
  add constraint payments_exactly_one_target_check
  check (num_nonnulls(order_id, dining_session_id) = 1) not valid;
alter table public.payments validate constraint payments_exactly_one_target_check;

alter table public.payments drop constraint if exists payments_manual_cashier_shape_check;
alter table public.payments
  add constraint payments_manual_cashier_shape_check check (
    payment_origin <> 'CASHIER'
    or (
      provider = 'MANUAL'
      and payment_method in ('CASH', 'QRIS')
      and cashier_id is not null
      and confirmed_by = cashier_id
      and confirmed_at is not null
      and idempotency_key is not null
      and btrim(idempotency_key) <> ''
      and status = 'PAID'
      and paid_at is not null
      and (
        (payment_method = 'CASH'
          and cash_received is not null
          and cash_received >= amount
          and change_amount = cash_received - amount)
        or
        (payment_method = 'QRIS'
          and cash_received is null
          and coalesce(change_amount, 0) = 0)
      )
    )
  ) not valid;
alter table public.payments validate constraint payments_manual_cashier_shape_check;

create unique index if not exists payments_idempotency_key_key
  on public.payments(idempotency_key)
  where idempotency_key is not null;
-- Historical provider rows remain untouched and may legitimately contain more
-- than one PAID event. The one-paid-target invariant applies to the new cashier
-- stream; RPC locking also excludes cross-target order/session payments.
create unique index if not exists payments_one_cashier_paid_order_key
  on public.payments(order_id)
  where order_id is not null and status = 'PAID' and payment_origin = 'CASHIER';
create unique index if not exists payments_one_cashier_paid_session_key
  on public.payments(dining_session_id)
  where dining_session_id is not null and status = 'PAID' and payment_origin = 'CASHIER';
create index if not exists idx_payments_dining_session_id
  on public.payments(dining_session_id);
create index if not exists idx_payments_cashier_id
  on public.payments(cashier_id);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null unique references public.payments(id) on delete restrict,
  order_id uuid references public.orders(id) on delete restrict,
  dining_session_id uuid references public.dining_sessions(id) on delete restrict,
  receipt_number text not null unique,
  snapshot jsonb not null,
  issued_by uuid not null references public.profiles(id) on delete restrict,
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint receipts_exactly_one_target_check
    check (num_nonnulls(order_id, dining_session_id) = 1)
);

create table if not exists public.receipt_print_attempts (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.receipts(id) on delete restrict,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'REQUESTED'
    check (status in ('REQUESTED', 'SUCCEEDED', 'FAILED')),
  printer_metadata jsonb,
  error_message text,
  attempted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint receipt_print_attempts_error_check
    check (status = 'FAILED' or error_message is null)
);

create index if not exists idx_receipts_order_id on public.receipts(order_id);
create index if not exists idx_receipts_dining_session_id on public.receipts(dining_session_id);
create index if not exists idx_receipt_print_attempts_receipt_id
  on public.receipt_print_attempts(receipt_id, attempted_at desc);

alter table public.receipts enable row level security;
alter table public.receipt_print_attempts enable row level security;

-- Receipt payloads are append-only evidence. Reprints create attempt rows; they
-- never mutate the original snapshot or receipt identity.
create or replace function public.reject_receipt_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception using errcode = '55000', message = 'Receipts are immutable';
end;
$$;

drop trigger if exists receipts_immutable on public.receipts;
create trigger receipts_immutable
  before update or delete on public.receipts
  for each row execute function public.reject_receipt_mutation();

revoke all on function public.reject_receipt_mutation() from public, anon, authenticated;

-- Operational rows are read directly, but all writes go through audited RPCs.
drop policy if exists "Staff read orders" on public.orders;
drop policy if exists "Admin full access orders" on public.orders;
drop policy if exists "Staff manage orders" on public.orders;
drop policy if exists "Kitchen update order status" on public.orders;
drop policy if exists "Staff write orders" on public.orders;
drop policy if exists "Admin write orders" on public.orders;

create policy "Staff read orders" on public.orders for select
  using (is_staff() or is_kitchen());

-- Retain customer-scoped SELECT policies; remove direct mutations.
drop policy if exists "Staff read order_items" on public.order_items;
drop policy if exists "Admin full access order_items" on public.order_items;
drop policy if exists "Staff manage order_items" on public.order_items;
create policy "Staff read order_items" on public.order_items for select
  using (is_staff() or is_kitchen());

drop policy if exists "Staff read order_item_options" on public.order_item_options;
drop policy if exists "Admin full access order_item_options" on public.order_item_options;
drop policy if exists "Staff manage order_item_options" on public.order_item_options;
create policy "Staff read order_item_options" on public.order_item_options for select
  using (is_staff() or is_kitchen());

drop policy if exists "Admin read payments" on public.payments;
drop policy if exists "Admin full access payments" on public.payments;
drop policy if exists "Staff read payments" on public.payments;
create policy "Admin read payments" on public.payments for select
  using (is_staff());

drop policy if exists "Staff read dining_sessions" on public.dining_sessions;
drop policy if exists "Admin full access dining_sessions" on public.dining_sessions;
drop policy if exists "Staff manage dining_sessions" on public.dining_sessions;
create policy "Staff read dining_sessions" on public.dining_sessions for select
  using (is_staff());

drop policy if exists "Admin full access order_status_history" on public.order_status_history;
drop policy if exists "Staff and Kitchen insert order_status_history" on public.order_status_history;

drop policy if exists "Admin read receipts" on public.receipts;
drop policy if exists "Admin read receipt_print_attempts" on public.receipt_print_attempts;
create policy "Admin read receipts" on public.receipts for select using (is_staff());
create policy "Admin read receipt_print_attempts" on public.receipt_print_attempts
  for select using (is_staff());

-- Base table privileges are tightened as well as RLS, including service clients
-- using the normal authenticated role. SECURITY DEFINER RPCs own all mutations.
revoke insert, update, delete on table public.orders from anon, authenticated;
revoke insert, update, delete on table public.order_items from anon, authenticated;
revoke insert, update, delete on table public.order_item_options from anon, authenticated;
revoke insert, update, delete on table public.payments from anon, authenticated;
revoke insert, update, delete on table public.dining_sessions from anon, authenticated;
revoke insert, update, delete on table public.order_status_history from anon, authenticated;
revoke insert, update, delete on table public.receipts from anon, authenticated;
revoke insert, update, delete on table public.receipt_print_attempts from anon, authenticated;

grant select on table public.receipts, public.receipt_print_attempts to authenticated;

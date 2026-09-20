-- 0033_owner_admin_management_and_order_delete_authorization.sql
-- Owner-only administration surface:
--   1. Close the profiles privilege-escalation hole. Until now the policy
--      "Admin full access profiles" used is_admin(), which since 0021 returns
--      true for admin AND owner, so any admin could UPDATE profiles and set
--      role='owner' straight through the Supabase API, bypassing every UI
--      guard. 0026 locked the operational tables but never revoked profile
--      writes. Profile writes now go through owner-checked RPCs only.
--   2. Harden is_owner()/is_admin() to match is_staff()/is_kitchen(): require
--      an active profile and pin search_path to public, pg_temp.
--   3. Store profile email so the owner account list can render it without a
--      service-role round trip.
--   4. Archive orders instead of deleting them. order_items and payments
--      cascade on delete and receipts restrict it, so a physical DELETE would
--      destroy payment history. Orders gain deleted_at/deleted_by/
--      deletion_reason and drop out of the operational list.
--   5. Guarantee the system always keeps one active owner.
--   6. Expose owner-only RPCs for order archival and account administration.

-- ---------------------------------------------------------------------------
-- 1. profiles: read for operations, write only through owner RPCs
-- ---------------------------------------------------------------------------

-- Supabase grants anon/authenticated broad table privileges by default. RLS was
-- the only thing standing between an admin and a role change, and its policy
-- was too permissive. Revoke the write grants outright.
revoke insert, update, delete on table public.profiles from anon, authenticated;

drop policy if exists "Admin full access profiles" on public.profiles;

-- Name resolution for the order history, expense list, and audit log. Staff
-- and above read the roster; kitchen keeps its own-profile read from 0009.
drop policy if exists "Operational read profiles" on public.profiles;
create policy "Operational read profiles" on public.profiles
  for select using (is_staff());

-- Owner-only write policies exist solely so the SECURITY DEFINER RPCs below
-- have a coherent policy surface. They never grant a client write path: the
-- table grants above are already revoked.
drop policy if exists "Owner insert profiles" on public.profiles;
create policy "Owner insert profiles" on public.profiles
  for insert with check (is_owner());

drop policy if exists "Owner update profiles" on public.profiles;
create policy "Owner update profiles" on public.profiles
  for update using (is_owner()) with check (is_owner());

drop policy if exists "Owner delete profiles" on public.profiles;
create policy "Owner delete profiles" on public.profiles
  for delete using (is_owner());

-- ---------------------------------------------------------------------------
-- 2. Role helpers: an inactive account holds no role at all
-- ---------------------------------------------------------------------------

create or replace function public.is_owner()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true and role = 'owner'
  )
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true and role in ('admin', 'owner')
  )
$$;

grant execute on function public.is_owner() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. profiles.email, backfilled from auth.users
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is distinct from u.email;

create unique index if not exists profiles_email_key
  on public.profiles (lower(email))
  where email is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, email, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'New User'),
    new.email,
    'staff', -- explicitly overriding any client-provided role
    true
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Order archival columns
-- ---------------------------------------------------------------------------

alter table public.orders
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id) on delete set null,
  add column if not exists deletion_reason text;

alter table public.orders drop constraint if exists orders_deletion_shape_check;
alter table public.orders
  add constraint orders_deletion_shape_check check (
    deleted_at is null
    or nullif(btrim(deletion_reason), '') is not null
  );

create index if not exists idx_orders_active_created_at
  on public.orders (created_at desc)
  where deleted_at is null;

-- Archived orders stay visible to the owner as an audit trail, but they leave
-- every operational surface.
drop policy if exists "Staff read orders" on public.orders;
create policy "Staff read orders" on public.orders for select
  using ((deleted_at is null and is_staff()) or is_owner());

-- ---------------------------------------------------------------------------
-- 5. The system must always retain one active owner
-- ---------------------------------------------------------------------------

create or replace function public.prevent_last_owner_removal()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_remaining int;
begin
  if tg_op = 'DELETE' then
    if old.role = 'owner' and old.is_active then
      select count(*) into v_remaining
      from public.profiles
      where role = 'owner' and is_active = true and id <> old.id;
      if v_remaining = 0 then
        raise exception using errcode = '23514',
          message = 'At least one active owner must remain';
      end if;
    end if;
    return old;
  end if;

  if old.role = 'owner' and old.is_active
    and (new.role <> 'owner' or new.is_active = false) then
    select count(*) into v_remaining
    from public.profiles
    where role = 'owner' and is_active = true and id <> old.id;
    if v_remaining = 0 then
      raise exception using errcode = '23514',
        message = 'At least one active owner must remain';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_last_owner_removal on public.profiles;
create trigger profiles_prevent_last_owner_removal
  before update or delete on public.profiles
  for each row execute function public.prevent_last_owner_removal();

revoke all on function public.prevent_last_owner_removal() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Owner-only RPCs
-- ---------------------------------------------------------------------------

-- Archives one order. Deliberately not a status transition: the order keeps its
-- status, payment rows, items, and receipt, and only leaves the operational
-- list. Orders inside a still-open dining session are refused, because the
-- session checkout reads them.
create or replace function public.admin_delete_order(
  p_order_id uuid,
  p_reason text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_role public.user_role;
  v_order public.orders%rowtype;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  select role into v_role from public.profiles
  where id = v_actor and is_active = true;
  if v_role is null or v_role <> 'owner' then
    raise exception using errcode = '42501', message = 'Owner access required';
  end if;

  if v_reason is null then
    raise exception using errcode = '22023', message = 'Deletion reason is required';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Order not found';
  end if;
  if v_order.deleted_at is not null then
    raise exception using errcode = '23514', message = 'Order is already archived';
  end if;
  if v_order.dining_session_id is not null and exists (
    select 1 from public.dining_sessions
    where id = v_order.dining_session_id and status = 'open'
  ) then
    raise exception using errcode = '23514',
      message = 'Order belongs to an open dining session';
  end if;

  update public.orders
  set deleted_at = clock_timestamp(),
      deleted_by = v_actor,
      deletion_reason = v_reason,
      updated_at = clock_timestamp()
  where id = p_order_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (v_actor, 'order.deleted', 'orders', p_order_id,
    jsonb_build_object(
      'order_number', v_order.order_number,
      'status', v_order.status,
      'reason', v_reason
    ));

  return jsonb_build_object('success', true, 'order_id', p_order_id);
end;
$$;

-- Only the two practical roles exist for this shop. Promoting an admin to
-- owner is allowed; demoting the last active owner is blocked by the trigger.
create or replace function public.admin_set_profile_role(
  p_target_id uuid,
  p_role public.user_role
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_role public.user_role;
  v_target public.profiles%rowtype;
begin
  select role into v_role from public.profiles
  where id = v_actor and is_active = true;
  if v_role is null or v_role <> 'owner' then
    raise exception using errcode = '42501', message = 'Owner access required';
  end if;

  if p_target_id = v_actor then
    raise exception using errcode = '23514', message = 'Cannot change your own role';
  end if;

  if p_role not in ('admin', 'owner') then
    raise exception using errcode = '22023', message = 'Role must be admin or owner';
  end if;

  select * into v_target from public.profiles where id = p_target_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Account not found';
  end if;

  update public.profiles
  set role = p_role, updated_at = clock_timestamp()
  where id = p_target_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (v_actor, 'profile.role_changed', 'profiles', p_target_id,
    jsonb_build_object(
      'target_name', v_target.full_name,
      'old_role', v_target.role,
      'new_role', p_role
    ));

  return jsonb_build_object('success', true, 'target_id', p_target_id, 'role', p_role);
end;
$$;

create or replace function public.admin_set_profile_active(
  p_target_id uuid,
  p_is_active boolean
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_role public.user_role;
  v_target public.profiles%rowtype;
begin
  select role into v_role from public.profiles
  where id = v_actor and is_active = true;
  if v_role is null or v_role <> 'owner' then
    raise exception using errcode = '42501', message = 'Owner access required';
  end if;

  if p_target_id = v_actor then
    raise exception using errcode = '23514', message = 'Cannot deactivate your own account';
  end if;

  select * into v_target from public.profiles where id = p_target_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Account not found';
  end if;

  update public.profiles
  set is_active = p_is_active, updated_at = clock_timestamp()
  where id = p_target_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (v_actor, 'profile.activation_changed', 'profiles', p_target_id,
    jsonb_build_object(
      'target_name', v_target.full_name,
      'is_active', p_is_active
    ));

  return jsonb_build_object('success', true, 'target_id', p_target_id, 'is_active', p_is_active);
end;
$$;

-- Explicit function surface: PUBLIC receives no implicit EXECUTE.
revoke all on function public.admin_delete_order(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_set_profile_role(uuid, public.user_role) from public, anon, authenticated;
revoke all on function public.admin_set_profile_active(uuid, boolean) from public, anon, authenticated;

grant execute on function public.admin_delete_order(uuid, text) to authenticated;
grant execute on function public.admin_set_profile_role(uuid, public.user_role) to authenticated;
grant execute on function public.admin_set_profile_active(uuid, boolean) to authenticated;
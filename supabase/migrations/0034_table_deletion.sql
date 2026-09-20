-- 0034_table_deletion.sql
-- Tables become deletable so a retired table frees its number and slug.
--
-- 0005 created dining_sessions.table_id as `not null ... on delete restrict`,
-- so a physical DELETE fails for any table that ever hosted a session — which
-- is every table in real use. Orders already use `on delete set null` (0006),
-- so order rows survive with a null table pointer.
--
-- The session FK is relaxed to `set null` too and table_id becomes nullable:
-- a session keeps its timings, status, and receipt snapshot, losing only the
-- pointer to a table that no longer exists. Deletion itself goes through an
-- admin-checked RPC that refuses a table with an open session and snapshots
-- the row into audit_logs, so "what was Meja 05?" stays answerable.

-- ---------------------------------------------------------------------------
-- 1. dining_sessions.table_id: restrict -> set null, and allow null
-- ---------------------------------------------------------------------------

alter table public.dining_sessions alter column table_id drop not null;

alter table public.dining_sessions
  drop constraint if exists dining_sessions_table_id_fkey;

alter table public.dining_sessions
  add constraint dining_sessions_table_id_fkey
  foreign key (table_id) references public.tables(id) on delete set null;

-- The partial unique index only guards open sessions against double-booking.
-- Nulls are distinct in a unique index, so orphaned closed sessions cannot
-- collide with each other or with live tables.

-- ---------------------------------------------------------------------------
-- 2. Deletion is only reachable through the audited RPC
-- ---------------------------------------------------------------------------

-- A direct DELETE would bypass the open-session guard and strand a live
-- session with a null table_id. Revoke the grant outright; the SECURITY
-- DEFINER RPC below still deletes as the table owner.
revoke delete on table public.tables from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. admin_delete_table: admin or owner, no open session, audited
-- ---------------------------------------------------------------------------

create or replace function public.admin_delete_table(
  p_table_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_role public.user_role;
  v_table public.tables%rowtype;
  v_open_sessions int;
begin
  select role into v_role from public.profiles
  where id = v_actor and is_active = true;
  if v_role is null or v_role not in ('admin', 'owner') then
    raise exception using errcode = '42501', message = 'Admin access required';
  end if;

  select * into v_table from public.tables where id = p_table_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Table not found';
  end if;

  -- Deleting a table mid-service would strand the guest's session and the
  -- cashier's checkout, so an open session blocks the delete until it closes.
  select count(*) into v_open_sessions
  from public.dining_sessions
  where table_id = p_table_id and status = 'open';
  if v_open_sessions > 0 then
    raise exception using errcode = '23514',
      message = 'Table has an open dining session';
  end if;

  -- Snapshot the identifying fields before the row is gone; the audit log is
  -- the only place the number and slug remain readable afterwards.
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (v_actor, 'table.deleted', 'tables', p_table_id,
    jsonb_build_object(
      'table_number', v_table.table_number,
      'name', v_table.name,
      'slug', v_table.slug,
      'capacity', v_table.capacity,
      'is_active', v_table.is_active
    ));

  delete from public.tables where id = p_table_id;

  return jsonb_build_object('success', true, 'table_id', p_table_id);
end;
$$;

revoke all on function public.admin_delete_table(uuid) from public, anon, authenticated;
grant execute on function public.admin_delete_table(uuid) to authenticated;
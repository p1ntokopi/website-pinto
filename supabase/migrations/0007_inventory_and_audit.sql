-- 0007_inventory_and_audit.sql

drop table if exists audit_logs cascade;
drop table if exists inventory_movements cascade;
drop table if exists inventory_items cascade;

create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text unique,
  unit text not null,
  current_quantity numeric(10,2) not null default 0,
  minimum_quantity numeric(10,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references inventory_items(id) on delete restrict,
  movement_type inventory_movement not null,
  quantity numeric(10,2) not null,
  reference_type text,
  reference_id text,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

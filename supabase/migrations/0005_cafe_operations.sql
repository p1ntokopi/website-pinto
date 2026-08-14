-- 0005_cafe_operations.sql

drop table if exists dining_sessions cascade;
drop table if exists tables cascade;

create table tables (
  id uuid primary key default gen_random_uuid(),
  table_number text not null unique,
  name text not null,
  slug text not null unique,
  capacity int not null check (capacity > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table dining_sessions (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references tables(id) on delete restrict,
  session_token text unique,
  status session_status not null default 'open',
  started_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure only one active session per table
create unique index idx_unique_active_session_per_table 
  on dining_sessions (table_id) 
  where status = 'open';

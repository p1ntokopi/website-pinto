-- 0004_coffee_roastery.sql

drop table if exists coffee_variants cascade;
drop table if exists coffee_product_flavor_notes cascade;
drop table if exists coffee_flavor_notes cascade;
drop table if exists coffee_products cascade;
drop table if exists coffee_origins cascade;

create table coffee_origins (
  id uuid primary key default gen_random_uuid(),
  country text not null,
  region text,
  farm text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table coffee_products (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  origin_id uuid references coffee_origins(id) on delete set null,
  process text,
  roast_level text,
  altitude_min int,
  altitude_max int,
  variety text,
  story text,
  brewing_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table coffee_flavor_notes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table coffee_product_flavor_notes (
  coffee_product_id uuid not null references coffee_products(id) on delete cascade,
  flavor_note_id uuid not null references coffee_flavor_notes(id) on delete cascade,
  primary key (coffee_product_id, flavor_note_id)
);

create table coffee_variants (
  id uuid primary key default gen_random_uuid(),
  coffee_product_id uuid not null references coffee_products(id) on delete cascade,
  weight_grams int not null check (weight_grams > 0),
  grind_type text not null,
  price numeric(12,2) not null check (price >= 0),
  stock_quantity int not null default 0,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

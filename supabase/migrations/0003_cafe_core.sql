-- 0003_cafe_core.sql

drop table if exists product_option_values cascade;
drop table if exists product_options cascade;
drop table if exists product_variants cascade;
drop table if exists products cascade;
drop table if exists categories cascade;

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  product_type product_type not null,
  base_price numeric(12,2) not null check (base_price >= 0),
  image_url text,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  price numeric(12,2) not null check (price >= 0),
  is_default boolean not null default false,
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  is_required boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_option_values (
  id uuid primary key default gen_random_uuid(),
  product_option_id uuid not null references product_options(id) on delete cascade,
  name text not null,
  price_adjustment numeric(12,2) not null default 0,
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 0006_customers_and_orders.sql

drop table if exists payments cascade;
drop table if exists order_item_options cascade;
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists addresses cascade;
drop table if exists customers cascade;

create table customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  label text,
  recipient_name text not null,
  phone text not null,
  address_line text not null,
  city text not null,
  province text not null,
  postal_code text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  order_type order_type not null,
  fulfillment_type fulfillment_type not null,
  customer_id uuid references customers(id) on delete set null,
  table_id uuid references tables(id) on delete set null,
  dining_session_id uuid references dining_sessions(id) on delete set null,
  subtotal numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  service_fee numeric(12,2) not null default 0,
  shipping_fee numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status order_status not null default 'PENDING',
  customer_name text,
  customer_phone text,
  shipping_recipient text,
  shipping_address text,
  shipping_city text,
  shipping_province text,
  shipping_postal_code text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  coffee_variant_id uuid references coffee_variants(id) on delete set null,
  product_name_snapshot text not null,
  variant_name_snapshot text,
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  notes text,
  created_at timestamptz not null default now()
);

create table order_item_options (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references order_items(id) on delete cascade,
  option_name_snapshot text not null,
  option_value_snapshot text not null,
  price_adjustment numeric(12,2) not null default 0
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  provider text not null default 'MIDTRANS',
  provider_transaction_id text unique,
  status payment_status not null default 'PENDING',
  amount numeric(12,2) not null check (amount >= 0),
  paid_at timestamptz,
  expired_at timestamptz,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

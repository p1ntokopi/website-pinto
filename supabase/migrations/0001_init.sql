-- Enums
create type user_role as enum ('staff', 'kitchen', 'admin', 'owner');
create type table_status as enum ('available', 'occupied', 'inactive');
create type session_status as enum ('open', 'closed');
create type order_status as enum ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled');
create type payment_status as enum ('unpaid', 'pending', 'paid', 'failed', 'expired', 'refunded');
create type payment_method as enum ('midtrans', 'cash');

-- Staff/admin accounts (customer TIDAK butuh akun — guest ordering)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role user_role not null default 'staff',
  created_at timestamptz not null default now()
);

-- Meja fisik
create table tables (
  id uuid primary key default gen_random_uuid(),
  table_number text not null,
  slug text not null unique,
  qr_token text unique,
  qr_expires_at timestamptz,
  status table_status not null default 'available',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Satu sesi makan per meja
create table dining_sessions (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references tables(id),
  status session_status not null default 'open',
  guest_count int,
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12,2) not null,
  image text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  price_modifier numeric(12,2) not null default 0,
  active boolean not null default true
);

create table product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null -- misal: "Ice", "Sugar"
);

create table product_option_values (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references product_options(id) on delete cascade,
  value text not null, -- misal: "Less Sugar"
  price_modifier numeric(12,2) not null default 0,
  active boolean not null default true
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  session_id uuid not null references dining_sessions(id),
  table_id uuid not null references tables(id),
  status order_status not null default 'pending',
  payment_status payment_status not null default 'unpaid',
  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  service_charge_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  version int not null default 0, -- untuk optimistic locking
  cancel_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  product_name_snapshot text not null, -- snapshot, jangan join ke products untuk histori
  unit_price numeric(12,2) not null, -- snapshot harga saat order dibuat
  quantity int not null default 1,
  notes text,
  subtotal numeric(12,2) not null
);

create table order_item_options (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references order_items(id) on delete cascade,
  option_name text not null,
  option_value text not null,
  price_modifier numeric(12,2) not null default 0
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  provider text not null default 'midtrans',
  method payment_method not null default 'midtrans',
  transaction_id text,
  status payment_status not null default 'pending',
  amount numeric(12,2) not null,
  received_by uuid references profiles(id), -- diisi kalau method = cash
  refund_amount numeric(12,2),
  refunded_at timestamptz,
  refunded_by uuid references profiles(id),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Indexes dasar
create index idx_orders_session on orders(session_id);
create index idx_orders_table on orders(table_id);
create index idx_order_items_order on order_items(order_id);
create index idx_payments_order on payments(order_id);
create index idx_products_category on products(category_id);

-- Aktifkan RLS di semua tabel
alter table profiles enable row level security;
alter table tables enable row level security;
alter table dining_sessions enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_options enable row level security;
alter table product_option_values enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_item_options enable row level security;
alter table payments enable row level security;
alter table audit_logs enable row level security;

-- Policy awal
create policy "public read active categories" on categories for select using (active = true);
create policy "public read active products" on products for select using (active = true);
create policy "public read active variants" on product_variants for select using (active = true);
create policy "public read options" on product_options for select using (true);
create policy "public read active option values" on product_option_values for select using (active = true);

create policy "staff full access categories" on categories for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('staff','admin','owner'))
);

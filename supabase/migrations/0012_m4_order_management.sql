-- 0012_m4_order_management.sql

-- 1. Add cancellation fields to orders table
alter table public.orders 
add column if not exists cancelled_at timestamptz,
add column if not exists cancelled_by uuid references auth.users(id) on delete set null,
add column if not exists cancellation_reason text;

-- 2. Create order_status_history table
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  old_status order_status, -- null means it was the initial creation
  new_status order_status not null,
  changed_by uuid references auth.users(id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- 3. Enable RLS on order_status_history
alter table public.order_status_history enable row level security;

-- 4. RLS Policies for order_status_history
-- Admin full access
create policy "Admin full access order_status_history" 
on public.order_status_history for all 
using (is_admin());

-- Staff read access
create policy "Staff read order_status_history" 
on public.order_status_history for select 
using (is_staff());

-- Kitchen read access
create policy "Kitchen read order_status_history" 
on public.order_status_history for select 
using (is_kitchen());

-- Insert policy for staff/kitchen (they can insert history when they change status)
create policy "Staff and Kitchen insert order_status_history" 
on public.order_status_history for insert 
with check (is_staff() or is_kitchen());

-- Customer read access (only for their own orders)
create policy "Customers read own order_status_history" 
on public.order_status_history for select 
using (
  order_id in (
    select id from public.orders where customer_id in (
      select id from public.customers where user_id = auth.uid()
    )
  )
);

-- 5. Enable Supabase Realtime on orders (if not already enabled)
begin;
  -- Create publication if it doesn't exist
  do $$
  begin
    if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
      create publication supabase_realtime;
    end if;
  end
  $$;

  -- Add the orders table to the publication
  alter publication supabase_realtime add table public.orders;
commit;

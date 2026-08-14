-- 0009_rls.sql

-- Enable RLS on all application tables
alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_options enable row level security;
alter table product_option_values enable row level security;
alter table coffee_origins enable row level security;
alter table coffee_products enable row level security;
alter table coffee_flavor_notes enable row level security;
alter table coffee_product_flavor_notes enable row level security;
alter table coffee_variants enable row level security;
alter table tables enable row level security;
alter table dining_sessions enable row level security;
alter table customers enable row level security;
alter table addresses enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_item_options enable row level security;
alter table payments enable row level security;
alter table inventory_items enable row level security;
alter table inventory_movements enable row level security;
alter table audit_logs enable row level security;


-- ==============================================================================
-- ADMIN: Full Access for Admins to almost everything (excluding internal auth stuff)
-- ==============================================================================
create policy "Admin full access profiles" on profiles for all using (is_admin());
create policy "Admin full access categories" on categories for all using (is_admin());
create policy "Admin full access products" on products for all using (is_admin());
create policy "Admin full access product_variants" on product_variants for all using (is_admin());
create policy "Admin full access product_options" on product_options for all using (is_admin());
create policy "Admin full access product_option_values" on product_option_values for all using (is_admin());
create policy "Admin full access coffee_origins" on coffee_origins for all using (is_admin());
create policy "Admin full access coffee_products" on coffee_products for all using (is_admin());
create policy "Admin full access coffee_flavor_notes" on coffee_flavor_notes for all using (is_admin());
create policy "Admin full access coffee_product_flavor_notes" on coffee_product_flavor_notes for all using (is_admin());
create policy "Admin full access coffee_variants" on coffee_variants for all using (is_admin());
create policy "Admin full access tables" on tables for all using (is_admin());
create policy "Admin full access dining_sessions" on dining_sessions for all using (is_admin());
create policy "Admin full access customers" on customers for all using (is_admin());
create policy "Admin full access addresses" on addresses for all using (is_admin());
create policy "Admin full access orders" on orders for all using (is_admin());
create policy "Admin full access order_items" on order_items for all using (is_admin());
create policy "Admin full access order_item_options" on order_item_options for all using (is_admin());
create policy "Admin full access payments" on payments for all using (is_admin());
create policy "Admin full access inventory_items" on inventory_items for all using (is_admin());
create policy "Admin full access inventory_movements" on inventory_movements for all using (is_admin());
create policy "Admin full access audit_logs" on audit_logs for all using (is_admin());


-- ==============================================================================
-- PUBLIC (ANONYMOUS & ALL USERS)
-- ==============================================================================
-- Public read access to active catalog data
create policy "Public read active categories" on categories for select using (is_active = true);
create policy "Public read active tables" on tables for select using (is_active = true);
create policy "Public read active products" on products for select using (is_available = true);
create policy "Public read active product_variants" on product_variants for select using (is_available = true);
create policy "Public read product_options" on product_options for select using (true);
create policy "Public read active product_option_values" on product_option_values for select using (is_available = true);
create policy "Public read coffee_origins" on coffee_origins for select using (true);
create policy "Public read coffee_products" on coffee_products for select using (true);
create policy "Public read coffee_flavor_notes" on coffee_flavor_notes for select using (true);
create policy "Public read coffee_product_flavor_notes" on coffee_product_flavor_notes for select using (true);
create policy "Public read active coffee_variants" on coffee_variants for select using (is_available = true);


-- ==============================================================================
-- STAFF
-- ==============================================================================
-- Profiles: staff can read their own profile
create policy "Users can read own profile" on profiles for select using (id = auth.uid());

-- Staff read catalog data (including inactive for admin/staff panels)
create policy "Staff read all categories" on categories for select using (is_staff());
create policy "Staff read all products" on products for select using (is_staff());
create policy "Staff read all product_variants" on product_variants for select using (is_staff());
create policy "Staff read all product_options" on product_options for select using (is_staff());
create policy "Staff read all product_option_values" on product_option_values for select using (is_staff());
create policy "Staff read all coffee_origins" on coffee_origins for select using (is_staff());
create policy "Staff read all coffee_products" on coffee_products for select using (is_staff());
create policy "Staff read all coffee_variants" on coffee_variants for select using (is_staff());

-- Staff operations
create policy "Staff read tables" on tables for select using (is_staff());
create policy "Staff manage dining_sessions" on dining_sessions for all using (is_staff());
create policy "Staff read and create customers" on customers for select using (is_staff());
create policy "Staff read and create customers (insert)" on customers for insert with check (is_staff());
create policy "Staff read addresses" on addresses for select using (is_staff());
create policy "Staff manage orders" on orders for all using (is_staff());
create policy "Staff manage order_items" on order_items for all using (is_staff());
create policy "Staff manage order_item_options" on order_item_options for all using (is_staff());
create policy "Staff read payments" on payments for select using (is_staff());


-- ==============================================================================
-- KITCHEN
-- ==============================================================================
-- Kitchen read catalog (useful for details if needed)
create policy "Kitchen read catalog categories" on categories for select using (is_kitchen());
create policy "Kitchen read catalog products" on products for select using (is_kitchen());

-- Kitchen read and update order status
create policy "Kitchen read orders" on orders for select using (is_kitchen());
create policy "Kitchen update order status" on orders for update using (is_kitchen()) with check (is_kitchen());
create policy "Kitchen read order_items" on order_items for select using (is_kitchen());
create policy "Kitchen read order_item_options" on order_item_options for select using (is_kitchen());


-- ==============================================================================
-- CUSTOMER (AUTHENTICATED)
-- ==============================================================================
create policy "Customers read own data" on customers for select using (user_id = auth.uid());
create policy "Customers update own data" on customers for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Customers read own addresses" on addresses for select using (
  customer_id in (select id from customers where user_id = auth.uid())
);
create policy "Customers update own addresses" on addresses for all using (
  customer_id in (select id from customers where user_id = auth.uid())
);
create policy "Customers read own orders" on orders for select using (
  customer_id in (select id from customers where user_id = auth.uid())
);
create policy "Customers read own order_items" on order_items for select using (
  order_id in (
    select id from orders where customer_id in (
      select id from customers where user_id = auth.uid()
    )
  )
);
create policy "Customers read own payments" on payments for select using (
  order_id in (
    select id from orders where customer_id in (
      select id from customers where user_id = auth.uid()
    )
  )
);

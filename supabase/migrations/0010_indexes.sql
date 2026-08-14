-- 0010_indexes.sql

-- Profiles
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_profiles_is_active on profiles(is_active);

-- Tables & Dining
create index if not exists idx_tables_slug on tables(slug);
create index if not exists idx_tables_is_active on tables(is_active);
create index if not exists idx_dining_sessions_table_id on dining_sessions(table_id);
create index if not exists idx_dining_sessions_status on dining_sessions(status);

-- Categories & Products
create index if not exists idx_categories_slug on categories(slug);
create index if not exists idx_categories_is_active on categories(is_active);
create index if not exists idx_products_slug on products(slug);
create index if not exists idx_products_category_id on products(category_id);
create index if not exists idx_products_is_available on products(is_available);
create index if not exists idx_products_product_type on products(product_type);

-- Coffee Variants
create index if not exists idx_coffee_variants_coffee_product_id on coffee_variants(coffee_product_id);

-- Orders
create index if not exists idx_orders_order_number on orders(order_number);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_order_type on orders(order_type);
create index if not exists idx_orders_table_id on orders(table_id);
create index if not exists idx_orders_created_at on orders(created_at);

-- Payments
create index if not exists idx_payments_order_id on payments(order_id);
create index if not exists idx_payments_provider_transaction_id on payments(provider_transaction_id);

-- Inventory
create index if not exists idx_inventory_items_sku on inventory_items(sku);
create index if not exists idx_inventory_movements_inventory_item_id on inventory_movements(inventory_item_id);

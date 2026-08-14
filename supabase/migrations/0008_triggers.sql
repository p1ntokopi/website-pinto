-- 0008_triggers.sql

create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tr_profiles_updated_at before update on profiles for each row execute procedure update_updated_at();
create trigger tr_categories_updated_at before update on categories for each row execute procedure update_updated_at();
create trigger tr_products_updated_at before update on products for each row execute procedure update_updated_at();
create trigger tr_product_variants_updated_at before update on product_variants for each row execute procedure update_updated_at();
create trigger tr_product_options_updated_at before update on product_options for each row execute procedure update_updated_at();
create trigger tr_product_option_values_updated_at before update on product_option_values for each row execute procedure update_updated_at();
create trigger tr_coffee_origins_updated_at before update on coffee_origins for each row execute procedure update_updated_at();
create trigger tr_coffee_products_updated_at before update on coffee_products for each row execute procedure update_updated_at();
create trigger tr_coffee_variants_updated_at before update on coffee_variants for each row execute procedure update_updated_at();
create trigger tr_tables_updated_at before update on tables for each row execute procedure update_updated_at();
create trigger tr_dining_sessions_updated_at before update on dining_sessions for each row execute procedure update_updated_at();
create trigger tr_customers_updated_at before update on customers for each row execute procedure update_updated_at();
create trigger tr_addresses_updated_at before update on addresses for each row execute procedure update_updated_at();
create trigger tr_orders_updated_at before update on orders for each row execute procedure update_updated_at();
create trigger tr_payments_updated_at before update on payments for each row execute procedure update_updated_at();
create trigger tr_inventory_items_updated_at before update on inventory_items for each row execute procedure update_updated_at();

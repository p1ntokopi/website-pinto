-- supabase/seed.sql

-- 1. Create Tables
insert into public.tables (table_number, name, slug, capacity, is_active)
values
  ('1', 'Table 01', 'table-01', 2, true),
  ('2', 'Table 02', 'table-02', 2, true),
  ('3', 'Table 03', 'table-03', 4, true),
  ('4', 'Table 04', 'table-04', 4, true),
  ('5', 'Table 05', 'table-05', 4, true),
  ('6', 'Table 06', 'table-06', 4, true),
  ('7', 'Table 07', 'table-07', 4, true),
  ('8', 'Table 08', 'table-08', 2, true),
  ('9', 'Table 09', 'table-09', 2, true),
  ('10', 'Table 10', 'table-10', 4, true)
on conflict (slug) do nothing;

-- 2. Create Categories
insert into public.categories (id, name, slug, description, sort_order)
values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Coffee', 'coffee', 'Espresso based and manual brew coffee', 1),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Non-Coffee', 'non-coffee', 'Tea, chocolate, and milk based drinks', 2),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'Food', 'food', 'Main courses and snacks', 3),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'Pastry', 'pastry', 'Fresh baked pastries', 4)
on conflict (id) do nothing;

-- 3. Create Products (Cafe)
insert into public.products (id, category_id, name, slug, description, product_type, base_price)
values
  ('55555555-5555-5555-5555-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Kopi Susu', 'kopi-susu', 'P1NTO Signature milk coffee with palm sugar', 'CAFE_DRINK', 25000),
  ('55555555-5555-5555-5555-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Latte', 'latte', 'Espresso with steamed milk', 'CAFE_DRINK', 28000),
  ('55555555-5555-5555-5555-000000000003'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Cappuccino', 'cappuccino', 'Espresso with steamed milk and thick foam', 'CAFE_DRINK', 28000),
  ('55555555-5555-5555-5555-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Americano', 'americano', 'Espresso poured over hot water', 'CAFE_DRINK', 24000),
  ('55555555-5555-5555-5555-000000000005'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Cold Brew', 'cold-brew', 'Slow steeped cold brew coffee', 'CAFE_DRINK', 27000),
  ('55555555-5555-5555-5555-000000000006'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Matcha Latte', 'matcha-latte', 'Premium matcha powder with milk', 'CAFE_DRINK', 30000),
  ('55555555-5555-5555-5555-000000000007'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Chocolate', 'chocolate', 'Signature thick chocolate drink', 'CAFE_DRINK', 28000),
  ('55555555-5555-5555-5555-000000000008'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'Croissant', 'croissant', 'Butter croissant', 'PASTRY', 22000),
  ('55555555-5555-5555-5555-000000000009'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'Pain au Chocolat', 'pain-au-chocolat', 'Chocolate filled croissant', 'PASTRY', 25000),
  ('55555555-5555-5555-5555-000000000010'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'Banana Bread', 'banana-bread', 'Moist banana bread slice', 'PASTRY', 24000)
on conflict (id) do nothing;

-- 4. Product Options
insert into public.product_options (id, product_id, name, is_required)
values
  ('66666666-6666-6666-6666-000000000001'::uuid, '55555555-5555-5555-5555-000000000001'::uuid, 'Size', true),
  ('66666666-6666-6666-6666-000000000002'::uuid, '55555555-5555-5555-5555-000000000001'::uuid, 'Ice', true),
  ('66666666-6666-6666-6666-000000000003'::uuid, '55555555-5555-5555-5555-000000000001'::uuid, 'Sugar', true)
on conflict (id) do nothing;

insert into public.product_option_values (product_option_id, name, price_adjustment)
values
  ('66666666-6666-6666-6666-000000000001'::uuid, 'Regular', 0),
  ('66666666-6666-6666-6666-000000000001'::uuid, 'Large', 5000),
  ('66666666-6666-6666-6666-000000000002'::uuid, 'Normal', 0),
  ('66666666-6666-6666-6666-000000000002'::uuid, 'Less', 0),
  ('66666666-6666-6666-6666-000000000002'::uuid, 'None', 0),
  ('66666666-6666-6666-6666-000000000003'::uuid, 'Normal', 0),
  ('66666666-6666-6666-6666-000000000003'::uuid, 'Less', 0)
on conflict do nothing;

-- 5. Coffee Origins
insert into public.coffee_origins (id, country, region, farm, description)
values
  ('77777777-7777-7777-7777-000000000001'::uuid, 'Ethiopia', 'Guji', 'Various Smallholders', 'Famous for floral and bright citrus notes.'),
  ('77777777-7777-7777-7777-000000000002'::uuid, 'Colombia', 'Huila', 'San Agustin', 'Balanced with chocolate and caramel sweetness.'),
  ('77777777-7777-7777-7777-000000000003'::uuid, 'Indonesia', 'Aceh', 'Gayo Highlands', 'Classic wet-hulled profile, herbal and spicy.'),
  ('77777777-7777-7777-7777-000000000004'::uuid, 'Indonesia', 'West Java', 'Pangalengan', 'Sweet, tea-like, and fruity.')
on conflict (id) do nothing;

-- 6. Coffee Products (Roastery Beans)
-- First create them in `products` to sell online
insert into public.products (id, category_id, name, slug, product_type, base_price)
values
  ('88888888-8888-8888-8888-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Ethiopia Guji Beans', 'bean-ethiopia-guji', 'COFFEE_BEAN', 145000),
  ('88888888-8888-8888-8888-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Colombia Huila Beans', 'bean-colombia-huila', 'COFFEE_BEAN', 140000),
  ('88888888-8888-8888-8888-000000000003'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Aceh Gayo Beans', 'bean-aceh-gayo', 'COFFEE_BEAN', 120000),
  ('88888888-8888-8888-8888-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'P1NTO House Blend', 'bean-p1nto-house', 'COFFEE_BEAN', 125000)
on conflict (id) do nothing;

insert into public.coffee_products (id, product_id, origin_id, process, roast_level, altitude_min, altitude_max, variety, brewing_notes)
values
  ('99999999-9999-9999-9999-000000000001'::uuid, '88888888-8888-8888-8888-000000000001'::uuid, '77777777-7777-7777-7777-000000000001'::uuid, 'Washed', 'Light Roast', 1800, 2000, 'Heirloom', 'Best for V60. Ratio 1:15, Water 92C.'),
  ('99999999-9999-9999-9999-000000000002'::uuid, '88888888-8888-8888-8888-000000000002'::uuid, '77777777-7777-7777-7777-000000000002'::uuid, 'Washed', 'Medium Roast', 1500, 1800, 'Caturra, Castillo', 'Versatile. Good for espresso and filter.'),
  ('99999999-9999-9999-9999-000000000003'::uuid, '88888888-8888-8888-8888-000000000003'::uuid, '77777777-7777-7777-7777-000000000003'::uuid, 'Wet Hulled', 'Medium Roast', 1300, 1500, 'Tim-tim, Ateng', 'Great for milk based drinks.'),
  ('99999999-9999-9999-9999-000000000004'::uuid, '88888888-8888-8888-8888-000000000004'::uuid, null, 'Blend', 'Medium Roast', null, null, 'Mixed', 'Designed for P1NTO Signature drinks.')
on conflict (id) do nothing;

-- 7. Coffee Flavor Notes
insert into public.coffee_flavor_notes (id, name)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001'::uuid, 'Floral'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000002'::uuid, 'Citrus'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000003'::uuid, 'Chocolate'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000004'::uuid, 'Caramel'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005'::uuid, 'Nutty'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000006'::uuid, 'Red Fruit'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000007'::uuid, 'Berry'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000008'::uuid, 'Tea-like'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000009'::uuid, 'Herbal'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000010'::uuid, 'Spice'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000011'::uuid, 'Sweet')
on conflict (name) do nothing;

-- Link flavors
insert into public.coffee_product_flavor_notes (coffee_product_id, flavor_note_id)
values
  ('99999999-9999-9999-9999-000000000001'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001'::uuid),
  ('99999999-9999-9999-9999-000000000001'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-000000000002'::uuid),
  ('99999999-9999-9999-9999-000000000001'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-000000000008'::uuid),
  ('99999999-9999-9999-9999-000000000002'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-000000000004'::uuid),
  ('99999999-9999-9999-9999-000000000002'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-000000000003'::uuid),
  ('99999999-9999-9999-9999-000000000002'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-000000000006'::uuid),
  ('99999999-9999-9999-9999-000000000003'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-000000000009'::uuid),
  ('99999999-9999-9999-9999-000000000003'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-000000000003'::uuid),
  ('99999999-9999-9999-9999-000000000003'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-000000000010'::uuid),
  ('99999999-9999-9999-9999-000000000004'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-000000000003'::uuid),
  ('99999999-9999-9999-9999-000000000004'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-000000000004'::uuid),
  ('99999999-9999-9999-9999-000000000004'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-000000000005'::uuid)
on conflict do nothing;

-- 8. Coffee Variants
insert into public.coffee_variants (id, coffee_product_id, weight_grams, grind_type, price, stock_quantity)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000001'::uuid, '99999999-9999-9999-9999-000000000001'::uuid, 250, 'Whole Bean', 145000, 10),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000002'::uuid, '99999999-9999-9999-9999-000000000001'::uuid, 250, 'Espresso', 145000, 5),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000003'::uuid, '99999999-9999-9999-9999-000000000001'::uuid, 250, 'V60', 145000, 5),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000004'::uuid, '99999999-9999-9999-9999-000000000001'::uuid, 500, 'Whole Bean', 260000, 5),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000005'::uuid, '99999999-9999-9999-9999-000000000001'::uuid, 1000, 'Whole Bean', 470000, 2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000006'::uuid, '99999999-9999-9999-9999-000000000004'::uuid, 1000, 'Whole Bean', 350000, 20)
on conflict (id) do nothing;

-- 9. Inventory Items
insert into public.inventory_items (id, name, sku, unit, current_quantity, minimum_quantity)
values
  ('cccccccc-cccc-cccc-cccc-000000000001'::uuid, 'House Blend Beans', 'SKU-BN-HSB', 'gram', 20000, 5000),
  ('cccccccc-cccc-cccc-cccc-000000000002'::uuid, 'Ethiopia Guji Beans', 'SKU-BN-ETH', 'gram', 5000, 1000),
  ('cccccccc-cccc-cccc-cccc-000000000003'::uuid, 'Fresh Milk', 'SKU-MLK-FRS', 'ml', 30000, 5000),
  ('cccccccc-cccc-cccc-cccc-000000000004'::uuid, 'Oat Milk', 'SKU-MLK-OAT', 'ml', 10000, 2000),
  ('cccccccc-cccc-cccc-cccc-000000000005'::uuid, 'Paper Cups', 'SKU-PKG-CUP', 'pcs', 1000, 200),
  ('cccccccc-cccc-cccc-cccc-000000000006'::uuid, 'Takeaway Cups', 'SKU-PKG-TAK', 'pcs', 1000, 200),
  ('cccccccc-cccc-cccc-cccc-000000000007'::uuid, 'Coffee Bags', 'SKU-PKG-BAG', 'pcs', 500, 100)
on conflict (id) do nothing;

-- supabase/seed.sql
-- Seed master data PINTÖ KUPI - Roasted and Eatery.
-- Berisi: tabel, kategori, produk minuman/makanan, opsi, origin kopi Nusantara,
-- biji kopi sangrai, profil rasa, varian berat, jasa roastery, dan inventory.

-- =============================================================================
-- 0. RESET MASTER DATA (urutan aman untuk foreign key)
-- =============================================================================
delete from public.inventory_movements;
delete from public.inventory_items;
delete from public.coffee_product_flavor_notes;
delete from public.coffee_variants;
delete from public.coffee_products;
delete from public.coffee_flavor_notes;
delete from public.coffee_origins;
delete from public.product_option_values;
delete from public.product_options;
delete from public.product_variants;
delete from public.products;
delete from public.categories;

-- =============================================================================
-- 1. TABLES (10 Meja)
-- =============================================================================
insert into public.tables (table_number, name, slug, capacity, is_active)
values
  ('1', 'Meja 01', 'table-01', 2, true),
  ('2', 'Meja 02', 'table-02', 2, true),
  ('3', 'Meja 03', 'table-03', 4, true),
  ('4', 'Meja 04', 'table-04', 4, true),
  ('5', 'Meja 05', 'table-05', 4, true),
  ('6', 'Meja 06', 'table-06', 4, true),
  ('7', 'Meja 07', 'table-07', 4, true),
  ('8', 'Meja 08', 'table-08', 2, true),
  ('9', 'Meja 09', 'table-09', 2, true),
  ('10', 'Meja 10', 'table-10', 4, true)
on conflict (slug) do update set name = excluded.name, capacity = excluded.capacity;

-- =============================================================================
-- 2. CATEGORIES (7 kategori)
-- =============================================================================
insert into public.categories (id, name, slug, description, sort_order, is_active)
values
  ('a0000000-0000-0000-0000-000000000001', 'White Coffee', 'white-coffee', 'Kopi susu & latte: signature khas Aceh hingga varian rasa', 1, true),
  ('a0000000-0000-0000-0000-000000000002', 'Black Coffee', 'black-coffee', 'Kopi hitam & seduhan manual: espresso hingga pour over', 2, true),
  ('a0000000-0000-0000-0000-000000000003', 'Non-Coffee', 'non-coffee', 'Minuman non-kopi: matcha, cokelat, susu, dan teh bunga', 3, true),
  ('a0000000-0000-0000-0000-000000000004', 'Dessert & Es Krim', 'dessert-ice-cream', 'Affogato dan es krim dengan pilihan rasa', 4, true),
  ('a0000000-0000-0000-0000-000000000005', 'Makanan & Camilan', 'food-snacks', 'Makanan berat dan camilan gurih', 5, true),
  ('a0000000-0000-0000-0000-000000000006', 'Kemasan Botol', 'bottle-packages', 'Botol siap minum 500ml dan 1 liter', 6, true),
  ('a0000000-0000-0000-0000-000000000007', 'Biji Kopi Sangrai', 'biji-kopi', 'Roastbeans Nusantara: Arabika, Robusta, house blend & jasa roastery', 7, true);

-- =============================================================================
-- 3. PRODUCTS — Minuman & Makanan (38 produk)
-- =============================================================================
-- 3a. White Coffee (8)
insert into public.products (id, category_id, name, slug, description, product_type, base_price, is_available, is_featured, sort_order)
values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Sanger Latte', 'sanger-latte', 'Signature khas Aceh: espresso + susu kental manis/UHT', 'CAFE_DRINK', 15000, true, true, 1),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Aren Latte', 'aren-latte', 'Espresso + susu segar + gula aren murni', 'CAFE_DRINK', 15000, true, true, 2),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Vanilla Latte', 'vanilla-latte', 'Espresso + susu segar + sirup vanilla', 'CAFE_DRINK', 15000, true, false, 3),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Cappuccino Latte', 'cappuccino-latte', 'Espresso + foam susu tebal', 'CAFE_DRINK', 15000, true, false, 4),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Coffee Latte', 'coffee-latte', 'Espresso + steamed milk lembut', 'CAFE_DRINK', 15000, true, false, 5),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Butterscotch Latte', 'butterscotch-latte', 'Espresso + susu + butterscotch creamy', 'CAFE_DRINK', 18000, true, false, 6),
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Banana Latte', 'banana-latte', 'Espresso + susu + ekstrak pisang', 'CAFE_DRINK', 20000, true, false, 7),
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Mochachino Latte', 'mochachino-latte', 'Espresso + dark cokelat + susu segar', 'CAFE_DRINK', 20000, true, false, 8);

-- 3b. Non-Coffee (8)
insert into public.products (id, category_id, name, slug, description, product_type, base_price, is_available, is_featured, sort_order)
values
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000003', 'Matcha Latte', 'matcha-latte', 'Matcha powder asli + susu segar', 'CAFE_DRINK', 15000, true, true, 1),
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000003', 'Chocolate Milk', 'chocolate-milk', 'Cokelat pekat kental + susu segar', 'CAFE_DRINK', 15000, true, false, 2),
  ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000003', 'Red Velvet', 'red-velvet', 'Red velvet gurih manis + susu segar', 'CAFE_DRINK', 15000, true, false, 3),
  ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000003', 'Blueberry Milk', 'blueberry-milk', 'Susu segar + blueberry infusion', 'CAFE_DRINK', 15000, true, false, 4),
  ('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000003', 'Strawberry Milk', 'strawberry-milk', 'Susu segar + strawberry infusion', 'CAFE_DRINK', 15000, true, false, 5),
  ('b0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000003', 'Banana Milk', 'banana-milk', 'Susu segar pisang creamy', 'CAFE_DRINK', 15000, true, false, 6),
  ('b0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000003', 'Telang Tea', 'telang-tea', 'Teh bunga telang alami segar', 'CAFE_DRINK', 10000, true, false, 7),
  ('b0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000003', 'Rosella Tea', 'rosella-tea', 'Teh bunga rosella asam manis segar', 'CAFE_DRINK', 10000, true, false, 8);

-- 3c. Black Coffee (10)
insert into public.products (id, category_id, name, slug, description, product_type, base_price, is_available, is_featured, sort_order)
values
  ('b0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000002', 'Longblack', 'longblack', 'Double shot espresso di atas es & air', 'CAFE_DRINK', 15000, true, false, 1),
  ('b0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000002', 'Black Berries', 'black-berries', 'Kopi hitam dingin segar aroma buah beri', 'CAFE_DRINK', 15000, true, false, 2),
  ('b0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000002', 'Black Honey', 'black-honey', 'Kopi hitam dingin dengan madu murni alami', 'CAFE_DRINK', 15000, true, false, 3),
  ('b0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000002', 'Japanese', 'japanese', 'Manual brew drip langsung di atas es', 'CAFE_DRINK', 15000, true, false, 4),
  ('b0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000002', 'V-60', 'v-60', 'Seduhan manual pour over filter V60', 'CAFE_DRINK', 15000, true, false, 5),
  ('b0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000002', 'Americano', 'americano', 'Espresso dengan air panas/dingin', 'CAFE_DRINK', 10000, true, false, 6),
  ('b0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000002', 'Espresso', 'espresso', 'Ekstraksi murni kopi pekat 30ml', 'CAFE_DRINK', 10000, true, false, 7),
  ('b0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000002', 'Tubruk A/R', 'tubruk-a-r', 'Kopi tubruk tradisional: pilihan Arabika / Robusta', 'CAFE_DRINK', 10000, true, false, 8),
  ('b0000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000002', 'Vietnam Drip', 'vietnam-drip', 'Drip saring Vietnam dengan susu kental manis', 'CAFE_DRINK', 15000, true, false, 9),
  ('b0000000-0000-0000-0000-000000000026', 'a0000000-0000-0000-0000-000000000002', 'French Press', 'french-press', 'Seduhan perendaman immersion filter metal', 'CAFE_DRINK', 15000, true, false, 10);

-- 3d. Dessert & Es Krim (3)
insert into public.products (id, category_id, name, slug, description, product_type, base_price, is_available, is_featured, sort_order)
values
  ('b0000000-0000-0000-0000-000000000027', 'a0000000-0000-0000-0000-000000000004', 'Affogato', 'affogato', '1 scoop es krim vanilla disiram 1 shot espresso panas', 'DESSERT', 18000, true, false, 1),
  ('b0000000-0000-0000-0000-000000000028', 'a0000000-0000-0000-0000-000000000004', 'Ice Cream Float', 'ice-cream-float', 'Es krim + minuman soda segar', 'DESSERT', 18000, true, false, 2),
  ('b0000000-0000-0000-0000-000000000029', 'a0000000-0000-0000-0000-000000000004', 'Ice Cream Aja', 'ice-cream-aja', 'Es krim pilihan rasa favorit', 'DESSERT', 10000, true, false, 3);

-- 3e. Kemasan Botol (2)
insert into public.products (id, category_id, name, slug, description, product_type, base_price, is_available, is_featured, sort_order)
values
  ('b0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000006', 'Bottle Package 500 ML', 'bottle-package-500', 'Kemasan botol siap minum 500ml (Sanger / Aren)', 'CAFE_DRINK', 35000, true, false, 1),
  ('b0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000006', 'Bottle Package 1 Liter', 'bottle-package-1l', 'Kemasan botol siap minum 1000ml (Sanger / Aren)', 'CAFE_DRINK', 65000, true, false, 2);

-- 3f. Makanan & Camilan (7)
insert into public.products (id, category_id, name, slug, description, product_type, base_price, is_available, is_featured, sort_order)
values
  ('b0000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000005', 'Mie Nyemek', 'mie-nyemek', 'Mie kuah nyemek gurih telur sayur. Add-on: fishroll', 'FOOD', 15000, true, false, 1),
  ('b0000000-0000-0000-0000-000000000033', 'a0000000-0000-0000-0000-000000000005', 'Kentang Goreng', 'kentang-goreng', 'French fries renyah dengan saus cocolan', 'FOOD', 15000, true, false, 2),
  ('b0000000-0000-0000-0000-000000000034', 'a0000000-0000-0000-0000-000000000005', 'Mix Platter', 'mix-platter', 'Platter komplit: sosis, bakso, 2 fishroll, kentang goreng', 'FOOD', 25000, true, false, 3),
  ('b0000000-0000-0000-0000-000000000035', 'a0000000-0000-0000-0000-000000000005', 'Stick Food', 'stick-food', 'Tusukan goreng gurih: sosis, bakso, 2 fishroll', 'FOOD', 15000, true, false, 4),
  ('b0000000-0000-0000-0000-000000000036', 'a0000000-0000-0000-0000-000000000005', 'Roti Canai', 'roti-canai', 'Roti canai lembut & gurih', 'FOOD', 15000, true, false, 5),
  ('b0000000-0000-0000-0000-000000000037', 'a0000000-0000-0000-0000-000000000005', 'Roti Bakar', 'roti-bakar', 'Roti bakar pilihan: keju susu / coklat keju susu', 'FOOD', 15000, true, false, 6),
  ('b0000000-0000-0000-0000-000000000038', 'a0000000-0000-0000-0000-000000000005', 'Beef Burger', 'beef-burger', 'Burger daging sapi panggang, sayur segar & saus', 'FOOD', 15000, true, false, 7);

-- =============================================================================
-- 4. PRODUCT OPTIONS — Minuman & Makanan
-- Opsi dibuat per produk agar kompatibel dengan halaman detail pesanan.
-- =============================================================================
-- 4a. Opsi minuman (White Coffee, Black Coffee, Non-Coffee)
do $$
declare
  r record;
  v_opt uuid;
begin
  for r in
    select p.id as product_id, p.slug
    from public.products p
    join public.categories c on c.id = p.category_id
    where c.slug in ('white-coffee', 'black-coffee', 'non-coffee')
  loop
    -- Suhu Penyajian (wajib)
    insert into public.product_options (product_id, name, is_required, sort_order)
    values (r.product_id, 'Suhu Penyajian', true, 1)
    returning id into v_opt;

    if r.slug in ('longblack', 'black-berries', 'black-honey', 'japanese', 'blueberry-milk', 'strawberry-milk') then
      insert into public.product_option_values (product_option_id, name, price_adjustment, sort_order)
      values (v_opt, 'Dingin / Ice', 0, 1);
    elsif r.slug in ('v-60', 'espresso', 'tubruk-a-r', 'vietnam-drip', 'french-press') then
      insert into public.product_option_values (product_option_id, name, price_adjustment, sort_order)
      values (v_opt, 'Panas / Hot', 0, 1);
    else
      insert into public.product_option_values (product_option_id, name, price_adjustment, sort_order)
      values
        (v_opt, 'Dingin / Ice', 0, 1),
        (v_opt, 'Panas / Hot', 0, 2);
    end if;

    -- Tingkat Manis (opsional) untuk minuman berbasis susu
    if r.slug in (
      'sanger-latte', 'aren-latte', 'vanilla-latte', 'cappuccino-latte', 'coffee-latte',
      'butterscotch-latte', 'banana-latte', 'mochachino-latte',
      'matcha-latte', 'chocolate-milk', 'red-velvet', 'banana-milk', 'vietnam-drip'
    ) then
      insert into public.product_options (product_id, name, is_required, sort_order)
      values (r.product_id, 'Tingkat Manis', false, 2)
      returning id into v_opt;
      insert into public.product_option_values (product_option_id, name, price_adjustment, sort_order)
      values
        (v_opt, 'Normal (100%)', 0, 1),
        (v_opt, 'Sedikit (50%)', 0, 2),
        (v_opt, 'Tanpa Gula (0%)', 0, 3);
    end if;

    -- Level Es (opsional) untuk minuman dingin
    if r.slug not in ('v-60', 'espresso', 'tubruk-a-r', 'vietnam-drip', 'french-press') then
      insert into public.product_options (product_id, name, is_required, sort_order)
      values (r.product_id, 'Level Es', false, 3)
      returning id into v_opt;
      insert into public.product_option_values (product_option_id, name, price_adjustment, sort_order)
      values
        (v_opt, 'Normal', 0, 1),
        (v_opt, 'Sedikit Es', 0, 2);
    end if;
  end loop;
end $$;

-- 4b. Opsi khusus Tubruk: pilihan biji Arabika / Robusta
do $$
declare
  v_opt uuid;
begin
  insert into public.product_options (product_id, name, is_required, sort_order)
  select id, 'Pilihan Biji', true, 4 from public.products where slug = 'tubruk-a-r'
  returning id into v_opt;
  insert into public.product_option_values (product_option_id, name, price_adjustment, sort_order)
  values
    (v_opt, 'Arabika', 0, 1),
    (v_opt, 'Robusta', 0, 2);
end $$;

-- 4c. Opsi es krim: pilihan rasa
do $$
declare
  v_product_id uuid;
  v_opt uuid;
begin
  for v_product_id in
    select id from public.products where slug in ('ice-cream-float', 'ice-cream-aja')
  loop
    insert into public.product_options (product_id, name, is_required, sort_order)
    values (v_product_id, 'Pilihan Rasa', true, 1)
    returning id into v_opt;
    insert into public.product_option_values (product_option_id, name, price_adjustment, sort_order)
    values
      (v_opt, 'Vanilla', 0, 1),
      (v_opt, 'Chocolate', 0, 2),
      (v_opt, 'Strawberry', 0, 3),
      (v_opt, 'Mix Neapolitan', 0, 4);
  end loop;
end $$;

-- 4d. Opsi makanan
do $$
declare
  v_opt uuid;
begin
  -- Mie Nyemek: add-on fishroll
  insert into public.product_options (product_id, name, is_required, sort_order)
  select id, 'Add-on', false, 1 from public.products where slug = 'mie-nyemek'
  returning id into v_opt;
  insert into public.product_option_values (product_option_id, name, price_adjustment, sort_order)
  values (v_opt, 'Ekstra Fishroll', 5000, 1);

  -- Roti Canai: pilihan varian
  insert into public.product_options (product_id, name, is_required, sort_order)
  select id, 'Varian', true, 1 from public.products where slug = 'roti-canai'
  returning id into v_opt;
  insert into public.product_option_values (product_option_id, name, price_adjustment, sort_order)
  values
    (v_opt, 'Original', 0, 1),
    (v_opt, 'Susu', 0, 2),
    (v_opt, 'Keju Susu', 0, 3);

  -- Roti Bakar: pilihan varian (Coklat Keju Susu +5.000)
  insert into public.product_options (product_id, name, is_required, sort_order)
  select id, 'Varian', true, 1 from public.products where slug = 'roti-bakar'
  returning id into v_opt;
  insert into public.product_option_values (product_option_id, name, price_adjustment, sort_order)
  values
    (v_opt, 'Keju Susu', 0, 1),
    (v_opt, 'Coklat Keju Susu', 5000, 2);
end $$;

-- 4e. Opsi kemasan botol: varian rasa
do $$
declare
  v_product_id uuid;
  v_opt uuid;
begin
  for v_product_id in
    select id from public.products where slug in ('bottle-package-500', 'bottle-package-1l')
  loop
    insert into public.product_options (product_id, name, is_required, sort_order)
    values (v_product_id, 'Varian Rasa', true, 1)
    returning id into v_opt;
    insert into public.product_option_values (product_option_id, name, price_adjustment, sort_order)
    values
      (v_opt, 'Sanger', 0, 1),
      (v_opt, 'Aren', 0, 2);
  end loop;
end $$;

-- =============================================================================
-- 5. COFFEE ORIGINS (10 daerah penghasil kopi Indonesia)
-- =============================================================================
insert into public.coffee_origins (id, country, region, farm, description)
values
  ('d0000000-0000-0000-0000-000000000001', 'Indonesia', 'Dataran Tinggi Gayo, Aceh', 'Petani Gayo Highlands', 'Tanah vulkanik subur, tinggi, dan sejuk menghasilkan karakter tebal, herbal, dan sedikit rempah.'),
  ('d0000000-0000-0000-0000-000000000002', 'Indonesia', 'Tapanuli Selatan, Sumatera Utara', 'Petani Mandailing', 'Profil manis dan rempah dengan body tebal khas kopi Mandailing.'),
  ('d0000000-0000-0000-0000-000000000003', 'Indonesia', 'Dairi, Sumatera Utara', 'Petani Sidikalang', 'Kopi Sidikalang dikenal dengan karakter rempah dan cokelat pekat.'),
  ('d0000000-0000-0000-0000-000000000004', 'Indonesia', 'Lampung', 'Petani Lampung', 'Penghasil robusta terbesar Indonesia dengan karakter earthy dan cokelat.'),
  ('d0000000-0000-0000-0000-000000000005', 'Indonesia', 'Gunung Kerinci, Jambi', 'Petani Kerinci', 'Dataran tinggi Kerinci menghasilkan kopi dengan keseimbangan rasa dan aroma harum.'),
  ('d0000000-0000-0000-0000-000000000006', 'Indonesia', 'Jawa Barat', 'Petani Pangalengan & Bandung', 'Rasa halus dengan nuansa teh, jeruk, dan floral yang elegan.'),
  ('d0000000-0000-0000-0000-000000000007', 'Indonesia', 'Jawa Tengah', 'Petani Temanggung', 'Kopi dataran Jawa Tengah dengan body sedang dan rasa manis.'),
  ('d0000000-0000-0000-0000-000000000008', 'Indonesia', 'Kintamani, Bali', 'Petani Subak Abian', 'Profil bright, citrus, dan tea-like dari ekosistem subak abian.'),
  ('d0000000-0000-0000-0000-000000000009', 'Indonesia', 'Tana Toraja, Sulawesi Selatan', 'Petani Toraja', 'Legenda kopi Indonesia: kaya, earthy, dengan cokelat dan rempah yang pekat.'),
  ('d0000000-0000-0000-0000-000000000010', 'Indonesia', 'Bajawa, Flores (NTT)', 'Petani Bajawa', 'Kopi Flores dengan karakter buah merah, manis, dan rempah khas NTT.');

-- =============================================================================
-- 6. COFFEE FLAVOR NOTES
-- =============================================================================
insert into public.coffee_flavor_notes (id, name)
values
  ('f0000000-0000-0000-0000-000000000001', 'Floral'),
  ('f0000000-0000-0000-0000-000000000002', 'Citrus'),
  ('f0000000-0000-0000-0000-000000000003', 'Cokelat'),
  ('f0000000-0000-0000-0000-000000000004', 'Karamel'),
  ('f0000000-0000-0000-0000-000000000005', 'Kacang'),
  ('f0000000-0000-0000-0000-000000000006', 'Buah Beri'),
  ('f0000000-0000-0000-0000-000000000007', 'Rempah'),
  ('f0000000-0000-0000-0000-000000000008', 'Herbal'),
  ('f0000000-0000-0000-0000-000000000009', 'Manis'),
  ('f0000000-0000-0000-0000-000000000010', 'Buah Merah'),
  ('f0000000-0000-0000-0000-000000000011', 'Khas Teh'),
  ('f0000000-0000-0000-0000-000000000012', 'Tanah / Earthy');

-- =============================================================================
-- 7. COFFEE BEAN PRODUCTS (22 biji kopi sangrai)
-- base_price = harga @100gr.
-- =============================================================================
insert into public.products (id, category_id, name, slug, description, product_type, base_price, is_available, is_featured, sort_order)
values
  -- Arabika (12)
  ('b0000000-0000-0000-0000-000000000039', 'a0000000-0000-0000-0000-000000000007', 'Arabika Aceh Gayo Luwak', 'arabika-gayo-luwak', 'Arabika Gayo proses fermentasi spesial kopi luwak', 'COFFEE_BEAN', 60000, true, true, 1),
  ('b0000000-0000-0000-0000-000000000040', 'a0000000-0000-0000-0000-000000000007', 'Arabika Aceh Gayo Winey', 'arabika-gayo-winey', 'Arabika Gayo fermentasi winey dengan karakter buah', 'COFFEE_BEAN', 45000, true, false, 2),
  ('b0000000-0000-0000-0000-000000000041', 'a0000000-0000-0000-0000-000000000007', 'Arabika Aceh Gayo Natural', 'arabika-gayo-natural', 'Arabika Gayo proses natural dengan manis buah beri', 'COFFEE_BEAN', 42500, true, false, 3),
  ('b0000000-0000-0000-0000-000000000042', 'a0000000-0000-0000-0000-000000000007', 'Arabika Aceh Gayo Peaberry', 'arabika-gayo-peaberry', 'Arabika Gayo peaberry full wash, biji bulat langka', 'COFFEE_BEAN', 40000, true, false, 4),
  ('b0000000-0000-0000-0000-000000000043', 'a0000000-0000-0000-0000-000000000007', 'Arabika Aceh Gayo', 'arabika-gayo', 'Arabika Gayo washed, ikon kopi Nusantara', 'COFFEE_BEAN', 30000, true, true, 5),
  ('b0000000-0000-0000-0000-000000000044', 'a0000000-0000-0000-0000-000000000007', 'Arabika Mandailing', 'arabika-mandailing', 'Arabika Mandailing washed dengan rempah manis', 'COFFEE_BEAN', 35000, true, false, 6),
  ('b0000000-0000-0000-0000-000000000045', 'a0000000-0000-0000-0000-000000000007', 'Arabika Jawa Barat', 'arabika-jawa-barat', 'Arabika Jawa Barat full wash, halus dan tea-like', 'COFFEE_BEAN', 35000, true, false, 7),
  ('b0000000-0000-0000-0000-000000000046', 'a0000000-0000-0000-0000-000000000007', 'Arabika Jawa Barat Natural', 'arabika-jawa-barat-natural', 'Arabika Jawa Barat natural dengan buah dan manis', 'COFFEE_BEAN', 40000, true, false, 8),
  ('b0000000-0000-0000-0000-000000000047', 'a0000000-0000-0000-0000-000000000007', 'Arabika Bali', 'arabika-bali', 'Arabika Kintamani Bali full wash, bright citrus', 'COFFEE_BEAN', 35000, true, false, 9),
  ('b0000000-0000-0000-0000-000000000048', 'a0000000-0000-0000-0000-000000000007', 'Arabika Toraja', 'arabika-toraja', 'Arabika Toraja full wash, legenda cokelat rempah', 'COFFEE_BEAN', 35000, true, false, 10),
  ('b0000000-0000-0000-0000-000000000049', 'a0000000-0000-0000-0000-000000000007', 'Arabika Kerinci', 'arabika-kerinci', 'Arabika Gunung Kerinci full wash, seimbang dan harum', 'COFFEE_BEAN', 35000, true, false, 11),
  ('b0000000-0000-0000-0000-000000000050', 'a0000000-0000-0000-0000-000000000007', 'Arabika Flores Bajawa', 'arabika-flores-bajawa', 'Arabika Flores Bajawa full wash, buah merah manis', 'COFFEE_BEAN', 35000, true, false, 12),
  -- Robusta (7)
  ('b0000000-0000-0000-0000-000000000051', 'a0000000-0000-0000-0000-000000000007', 'Robusta Aceh Gayo', 'robusta-gayo', 'Robusta Gayo natural, body tebal cokelat kacang', 'COFFEE_BEAN', 20000, true, false, 13),
  ('b0000000-0000-0000-0000-000000000052', 'a0000000-0000-0000-0000-000000000007', 'Robusta Aceh SaNger', 'robusta-sanger', 'Robusta Aceh washed, karakter cokelat manis', 'COFFEE_BEAN', 20000, true, false, 14),
  ('b0000000-0000-0000-0000-000000000053', 'a0000000-0000-0000-0000-000000000007', 'Robusta Toraja', 'robusta-toraja', 'Robusta Toraja washed, kaya dan beraroma', 'COFFEE_BEAN', 20000, true, false, 15),
  ('b0000000-0000-0000-0000-000000000054', 'a0000000-0000-0000-0000-000000000007', 'Robusta Lampung', 'robusta-lampung', 'Robusta Lampung natural, earthy dan pekat', 'COFFEE_BEAN', 18000, true, false, 16),
  ('b0000000-0000-0000-0000-000000000055', 'a0000000-0000-0000-0000-000000000007', 'Robusta Sidikalang', 'robusta-sidikalang', 'Robusta Sidikalang washed, rempah cokelat pekat', 'COFFEE_BEAN', 20000, true, false, 17),
  ('b0000000-0000-0000-0000-000000000056', 'a0000000-0000-0000-0000-000000000007', 'Robusta Jawa Barat', 'robusta-jawa-barat', 'Robusta Jawa Barat washed, cokelat dan manis', 'COFFEE_BEAN', 20000, true, false, 18),
  ('b0000000-0000-0000-0000-000000000057', 'a0000000-0000-0000-0000-000000000007', 'Robusta Jawa Tengah', 'robusta-jawa-tengah', 'Robusta Jawa Tengah washed, cokelat earthy', 'COFFEE_BEAN', 18000, true, false, 19),
  -- House Blend (3)
  ('b0000000-0000-0000-0000-000000000058', 'a0000000-0000-0000-0000-000000000007', 'A70:R30 Spesial Blend', 'blend-a70-r30', '70% Arabika : 30% Robusta, blend spesial keseimbangan', 'COFFEE_BEAN', 27000, true, true, 20),
  ('b0000000-0000-0000-0000-000000000059', 'a0000000-0000-0000-0000-000000000007', 'A50:R50 Espresso Blend', 'blend-a50-r50', '50% Arabika : 50% Robusta, dirancang untuk espresso', 'COFFEE_BEAN', 25000, true, false, 21),
  ('b0000000-0000-0000-0000-000000000060', 'a0000000-0000-0000-0000-000000000007', 'A30:R70 Kopi Susu Blend', 'blend-a30-r70', '30% Arabika : 70% Robusta, sempurna untuk kopi susu', 'COFFEE_BEAN', 23000, true, false, 22);

-- =============================================================================
-- 8. COFFEE PRODUCTS (detail biji kopi)
-- =============================================================================
insert into public.coffee_products (id, product_id, origin_id, process, roast_level, altitude_min, altitude_max, variety, story, brewing_notes)
values
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000039', 'd0000000-0000-0000-0000-000000000001', 'Fermentasi', 'Medium Roast', 1100, 1600, 'Gayo', 'Kopi luwak Gayo diproses melalui fermentasi alami, menghasilkan kehalusan dan manis yang legendaris.', 'Cocok untuk V60. Rasio 1:15, air 92C.'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000040', 'd0000000-0000-0000-0000-000000000001', 'Fermentasi', 'Medium Roast', 1100, 1600, 'Gayo', 'Proses fermentasi winey menghadirkan aroma buah dan fermentasi yang kompleks.', 'Cocok untuk V60 atau Kalita. Rasio 1:15.'),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000041', 'd0000000-0000-0000-0000-000000000001', 'Natural', 'Medium Roast', 1100, 1600, 'Gayo', 'Proses natural menangkap manis buah beri pada biji yang dikeringkan dengan daging buahnya.', 'Paling baik diseduh dengan pour over. Rasio 1:16.'),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000042', 'd0000000-0000-0000-0000-000000000001', 'Full Wash', 'Medium Roast', 1100, 1600, 'Peaberry', 'Peaberry langka dengan profil rasa yang lebih padat dan jernih.', 'Cocok untuk filter. Rasio 1:15, air 90-92C.'),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000043', 'd0000000-0000-0000-0000-000000000001', 'Washed', 'Medium Roast', 1100, 1600, 'Tim-Tim / Ateng', 'Ikon kopi Nusantara: tebal, herbal, dan sedikit rempah khas dataran tinggi Gayo.', 'Cocok untuk espresso dan minuman berbasis susu.'),
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000044', 'd0000000-0000-0000-0000-000000000002', 'Washed', 'Medium Roast', 1100, 1600, 'Sigararutang', 'Mandailing klasik dengan body tebal, rempah, dan manis gula merah.', 'Cocok untuk tubruk, espresso, dan french press.'),
  ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000045', 'd0000000-0000-0000-0000-000000000006', 'Full Wash', 'Medium Roast', 1200, 1800, 'Andung Sari', 'Jawa Barat full wash yang halus dengan nuansa teh dan citrus.', 'Cocok untuk V60. Rasio 1:16, air 90C.'),
  ('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000046', 'd0000000-0000-0000-0000-000000000006', 'Natural', 'Medium Roast', 1200, 1800, 'Andung Sari', 'Proses natural menghadirkan manis buah dan citrus yang cerah.', 'Cocok untuk pour over. Rasio 1:15.'),
  ('c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000047', 'd0000000-0000-0000-0000-000000000008', 'Full Wash', 'Medium Roast', 1200, 1700, 'Kintamani', 'Kintamani dengan keseimbangan citrus dan khas teh dari ekosistem subak abian.', 'Cocok untuk V60 dan cold brew.'),
  ('c0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000048', 'd0000000-0000-0000-0000-000000000009', 'Full Wash', 'Medium Roast', 1400, 1900, 'S795', 'Legenda Toraja: kaya, earthy, dengan cokelat dan rempah yang pekat.', 'Cocok untuk tubruk, espresso, dan french press.'),
  ('c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000049', 'd0000000-0000-0000-0000-000000000005', 'Full Wash', 'Medium Roast', 1200, 1600, 'S795 / Kartika', 'Kerinci yang seimbang, harum, dengan sentuhan cokelat dan karamel.', 'Cocok untuk filter dan espresso.'),
  ('c0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000050', 'd0000000-0000-0000-0000-000000000010', 'Full Wash', 'Medium Roast', 1200, 1800, 'Typica', 'Flores Bajawa dengan buah merah, manis, dan rempah khas NTT.', 'Cocok untuk V60. Rasio 1:15, air 92C.'),
  ('c0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000051', 'd0000000-0000-0000-0000-000000000001', 'Natural', 'Medium-Dark Roast', 500, 900, 'Robusta Gayo', 'Robusta dataran tinggi Gayo dengan body sangat tebal dan cokelat pekat.', 'Cocok untuk espresso dan minuman berbasis susu.'),
  ('c0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000052', 'd0000000-0000-0000-0000-000000000001', 'Washed', 'Medium-Dark Roast', 500, 900, 'Robusta', 'Robusta SaNger washed dengan karakter cokelat dan manis.', 'Cocok untuk espresso dan kopi susu.'),
  ('c0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000053', 'd0000000-0000-0000-0000-000000000009', 'Washed', 'Medium-Dark Roast', 800, 1200, 'Robusta', 'Robusta Toraja washed yang kaya dan beraroma rempah.', 'Cocok untuk espresso dan french press.'),
  ('c0000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000054', 'd0000000-0000-0000-0000-000000000004', 'Natural', 'Medium-Dark Roast', 400, 800, 'Robusta Lampung', 'Robusta Lampung natural, earthy, dan pekat khas kopi Nusantara.', 'Cocok untuk tubruk, espresso, dan kopi susu.'),
  ('c0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000055', 'd0000000-0000-0000-0000-000000000003', 'Washed', 'Medium-Dark Roast', 700, 1100, 'Robusta Sidikalang', 'Sidikalang dengan rempah dan cokelat yang pekat dan tajam.', 'Cocok untuk espresso dan french press.'),
  ('c0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000056', 'd0000000-0000-0000-0000-000000000006', 'Washed', 'Medium-Dark Roast', 800, 1200, 'Robusta', 'Robusta Jawa Barat washed, cokelat manis dengan body tebal.', 'Cocok untuk espresso dan kopi susu.'),
  ('c0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000057', 'd0000000-0000-0000-0000-000000000007', 'Washed', 'Medium-Dark Roast', 700, 1100, 'Robusta', 'Robusta Jawa Tengah washed, cokelat earthy yang seimbang.', 'Cocok untuk tubruk dan espresso.'),
  ('c0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000058', null, 'Blend', 'Medium Roast', null, null, 'A70:R30', 'Blend 70% Arabika : 30% Robusta untuk keseimbangan aroma dan body.', 'Serbaguna untuk semua metode seduh.'),
  ('c0000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000059', null, 'Blend', 'Medium Roast', null, null, 'A50:R50', 'Blend 50% Arabika : 50% Robusta, dirancang khusus untuk espresso.', 'Cocok untuk espresso dan moka pot.'),
  ('c0000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000060', null, 'Blend', 'Medium-Dark Roast', null, null, 'A30:R70', 'Blend 30% Arabika : 70% Robusta dengan body tebal untuk kopi susu.', 'Cocok untuk espresso dan minuman berbasis susu.');

-- =============================================================================
-- 9. COFFEE PRODUCT FLAVOR NOTES
-- =============================================================================
insert into public.coffee_product_flavor_notes (coffee_product_id, flavor_note_id)
values
  ('c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000004'),
  ('c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000005'),
  ('c0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000010'),
  ('c0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000006'),
  ('c0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000009'),
  ('c0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000006'),
  ('c0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000010'),
  ('c0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000009'),
  ('c0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000004'),
  ('c0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000005'),
  ('c0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000008'),
  ('c0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000007'),
  ('c0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000007'),
  ('c0000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000009'),
  ('c0000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000011'),
  ('c0000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000006'),
  ('c0000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000009'),
  ('c0000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000011'),
  ('c0000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000004'),
  ('c0000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000004'),
  ('c0000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000007'),
  ('c0000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000004'),
  ('c0000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000005'),
  ('c0000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000010'),
  ('c0000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000009'),
  ('c0000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000005'),
  ('c0000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000012'),
  ('c0000000-0000-0000-0000-000000000014', 'f0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000014', 'f0000000-0000-0000-0000-000000000005'),
  ('c0000000-0000-0000-0000-000000000014', 'f0000000-0000-0000-0000-000000000009'),
  ('c0000000-0000-0000-0000-000000000015', 'f0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000015', 'f0000000-0000-0000-0000-000000000005'),
  ('c0000000-0000-0000-0000-000000000015', 'f0000000-0000-0000-0000-000000000007'),
  ('c0000000-0000-0000-0000-000000000016', 'f0000000-0000-0000-0000-000000000012'),
  ('c0000000-0000-0000-0000-000000000016', 'f0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000016', 'f0000000-0000-0000-0000-000000000005'),
  ('c0000000-0000-0000-0000-000000000017', 'f0000000-0000-0000-0000-000000000012'),
  ('c0000000-0000-0000-0000-000000000017', 'f0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000017', 'f0000000-0000-0000-0000-000000000007'),
  ('c0000000-0000-0000-0000-000000000018', 'f0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000018', 'f0000000-0000-0000-0000-000000000005'),
  ('c0000000-0000-0000-0000-000000000018', 'f0000000-0000-0000-0000-000000000009'),
  ('c0000000-0000-0000-0000-000000000019', 'f0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000019', 'f0000000-0000-0000-0000-000000000012'),
  ('c0000000-0000-0000-0000-000000000019', 'f0000000-0000-0000-0000-000000000005'),
  ('c0000000-0000-0000-0000-000000000020', 'f0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000020', 'f0000000-0000-0000-0000-000000000004'),
  ('c0000000-0000-0000-0000-000000000020', 'f0000000-0000-0000-0000-000000000005'),
  ('c0000000-0000-0000-0000-000000000021', 'f0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000021', 'f0000000-0000-0000-0000-000000000005'),
  ('c0000000-0000-0000-0000-000000000021', 'f0000000-0000-0000-0000-000000000007'),
  ('c0000000-0000-0000-0000-000000000022', 'f0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000022', 'f0000000-0000-0000-0000-000000000004'),
  ('c0000000-0000-0000-0000-000000000022', 'f0000000-0000-0000-0000-000000000009');

-- =============================================================================
-- 10. COFFEE VARIANTS (88 baris = 22 biji x 4 berat)
-- Harga per berat = base_price @100gr x (berat / 100).
-- Grind default "Biji Utuh"; pilihan gilingan disediakan lewat product option.
-- =============================================================================
do $$
declare
  r record;
  w int;
begin
  for r in
    select cp.id as coffee_product_id, p.base_price
    from public.coffee_products cp
    join public.products p on p.id = cp.product_id
  loop
    for w in select unnest(array[100, 250, 500, 1000])
    loop
      insert into public.coffee_variants (coffee_product_id, weight_grams, grind_type, price, stock_quantity, is_available)
      values (r.coffee_product_id, w, 'Biji Utuh', r.base_price * w / 100.0, 10, true);
    end loop;
  end loop;
end $$;

-- 10b. Opsi gilingan untuk setiap biji kopi
do $$
declare
  r record;
  v_opt uuid;
begin
  for r in
    select id from public.products where product_type = 'COFFEE_BEAN'
  loop
    insert into public.product_options (product_id, name, is_required, sort_order)
    values (r.id, 'Gilingan', true, 1)
    returning id into v_opt;
    insert into public.product_option_values (product_option_id, name, price_adjustment, sort_order)
    values
      (v_opt, 'Biji Utuh', 0, 1),
      (v_opt, 'Giling Halus', 0, 2),
      (v_opt, 'Giling Sedang', 0, 3),
      (v_opt, 'Giling Kasar', 0, 4);
  end loop;
end $$;

-- =============================================================================
-- 11. JASA ROASTERY & GILING (2 produk SERVICE)
-- =============================================================================
insert into public.products (id, category_id, name, slug, description, product_type, base_price, is_available, is_featured, sort_order)
values
  ('b0000000-0000-0000-0000-000000000061', 'a0000000-0000-0000-0000-000000000007', 'Jasa Giling Kopi', 'jasa-giling-kopi', 'Layanan penggilingan kopi segar sesuai kebutuhan (Rp 10.000/kg)', 'SERVICE', 10000, true, false, 23),
  ('b0000000-0000-0000-0000-000000000062', 'a0000000-0000-0000-0000-000000000007', 'Jasa Roasting Kopi', 'jasa-roasting-kopi', 'Layanan sangrai kopi custom (Rp 30.000/kg, minimum 2 kg)', 'SERVICE', 30000, true, false, 24);

-- =============================================================================
-- 12. INVENTORY ITEMS (bahan baku riil Pinto Kupi)
-- =============================================================================
insert into public.inventory_items (id, name, sku, unit, current_quantity, minimum_quantity, is_active)
values
  ('e0000000-0000-0000-0000-000000000001', 'Biji Kopi Arabika Aceh Gayo', 'SKU-BN-GAYO', 'gram', 20000, 5000, true),
  ('e0000000-0000-0000-0000-000000000002', 'Biji Kopi Robusta', 'SKU-BN-RBT', 'gram', 15000, 5000, true),
  ('e0000000-0000-0000-0000-000000000003', 'Fresh Milk', 'SKU-MLK-FRS', 'ml', 30000, 5000, true),
  ('e0000000-0000-0000-0000-000000000004', 'Susu Kental Manis', 'SKU-MLK-SKM', 'ml', 20000, 5000, true),
  ('e0000000-0000-0000-0000-000000000005', 'Gula Aren Cair', 'SKU-SWG-ARN', 'ml', 15000, 3000, true),
  ('e0000000-0000-0000-0000-000000000006', 'Bubuk Cokelat', 'SKU-PWD-CKT', 'gram', 10000, 2000, true),
  ('e0000000-0000-0000-0000-000000000007', 'Bubuk Matcha', 'SKU-PWD-MTC', 'gram', 5000, 1000, true),
  ('e0000000-0000-0000-0000-000000000008', 'Bunga Telang', 'SKU-TEA-TLG', 'gram', 3000, 500, true),
  ('e0000000-0000-0000-0000-000000000009', 'Bunga Rosella', 'SKU-TEA-RSL', 'gram', 3000, 500, true),
  ('e0000000-0000-0000-0000-000000000010', 'Es Krim Vanilla', 'SKU-ICR-VNL', 'pcs', 60, 20, true),
  ('e0000000-0000-0000-0000-000000000011', 'Es Krim Cokelat', 'SKU-ICR-CKT', 'pcs', 60, 20, true),
  ('e0000000-0000-0000-0000-000000000012', 'Es Krim Stroberi', 'SKU-ICR-STR', 'pcs', 60, 20, true),
  ('e0000000-0000-0000-0000-000000000013', 'Mie Instan', 'SKU-FD-MIE', 'pcs', 200, 50, true),
  ('e0000000-0000-0000-0000-000000000014', 'Fishroll', 'SKU-FD-FSR', 'pcs', 200, 50, true),
  ('e0000000-0000-0000-0000-000000000015', 'Sosis', 'SKU-FD-SOS', 'pcs', 200, 50, true),
  ('e0000000-0000-0000-0000-000000000016', 'Bakso Sapi', 'SKU-FD-BKS', 'pcs', 200, 50, true),
  ('e0000000-0000-0000-0000-000000000017', 'Kentang Beku', 'SKU-FD-KTG', 'gram', 20000, 5000, true),
  ('e0000000-0000-0000-0000-000000000018', 'Roti Tawar / Canai', 'SKU-FD-ROT', 'pcs', 100, 20, true),
  ('e0000000-0000-0000-0000-000000000019', 'Patty Burger', 'SKU-FD-PTY', 'pcs', 50, 20, true),
  ('e0000000-0000-0000-0000-000000000020', 'Cup Dingin 12/16oz', 'SKU-PKG-CPD', 'pcs', 1000, 200, true),
  ('e0000000-0000-0000-0000-000000000021', 'Cup Panas 8oz', 'SKU-PKG-CPH', 'pcs', 1000, 200, true),
  ('e0000000-0000-0000-0000-000000000022', 'Botol 500ml', 'SKU-PKG-BTL5', 'pcs', 100, 20, true),
  ('e0000000-0000-0000-0000-000000000023', 'Botol 1 Liter', 'SKU-PKG-BTL1', 'pcs', 100, 20, true),
  ('e0000000-0000-0000-0000-000000000024', 'Standing Pouch Kopi 100g/250g', 'SKU-PKG-PCH', 'pcs', 500, 100, true);
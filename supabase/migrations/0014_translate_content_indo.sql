-- 0014_translate_content_indo.sql
-- Terjemahkan konten database ke bahasa Indonesia.

begin;

-- ============ Kategori ============
update categories
set name = 'Kopi',
    description = 'Kopi berbasis espresso dan seduhan manual'
where id = '11111111-1111-1111-1111-111111111111';

update categories
set name = 'Non-Kopi',
    description = 'Minuman berbahan dasar teh, cokelat, dan susu'
where id = '22222222-2222-2222-2222-222222222222';

update categories
set name = 'Makanan',
    description = 'Menu utama dan camilan'
where id = '33333333-3333-3333-3333-333333333333';

update categories
set name = 'Pastry',
    description = 'Pastry panggang segar'
where id = '44444444-4444-4444-4444-444444444444';

-- ============ Deskripsi produk ============
update products
set description = 'Kopi susu signature P1NTO dengan gula aren'
where id = '55555555-5555-5555-5555-000000000001';

update products
set description = 'Espresso dengan susu steam'
where id = '55555555-5555-5555-5555-000000000002';

update products
set description = 'Espresso dengan susu steam dan busa tebal'
where id = '55555555-5555-5555-5555-000000000003';

update products
set description = 'Espresso yang dituang dengan air panas'
where id = '55555555-5555-5555-5555-000000000004';

update products
set description = 'Kopi cold brew yang diseduh perlahan'
where id = '55555555-5555-5555-5555-000000000005';

update products
set description = 'Bubuk matcha premium dengan susu'
where id = '55555555-5555-5555-5555-000000000006';

update products
set description = 'Minuman cokelat kental signature'
where id = '55555555-5555-5555-5555-000000000007';

update products
set description = 'Croissant mentega'
where id = '55555555-5555-5555-5555-000000000008';

update products
set description = 'Croissant isi cokelat'
where id = '55555555-5555-5555-5555-000000000009';

update products
set description = 'Potongan banana bread yang lembut'
where id = '55555555-5555-5555-5555-000000000010';

-- ============ Deskripsi origin ============
update coffee_origins
set description = 'Terkenal dengan aroma floral dan sentuhan jeruk yang cerah.'
where id = '77777777-7777-7777-7777-000000000001';

update coffee_origins
set description = 'Seimbang dengan manis cokelat dan karamel.'
where id = '77777777-7777-7777-7777-000000000002';

update coffee_origins
set description = 'Profil wet-hulled klasik, herbal dan rempah.'
where id = '77777777-7777-7777-7777-000000000003';

update coffee_origins
set description = 'Manis, seperti teh, dan fruity.'
where id = '77777777-7777-7777-7777-000000000004';

-- ============ Catatan seduh biji kopi ============
update coffee_products
set brewing_notes = 'Cocok untuk V60. Rasio 1:15, air 92C.'
where id = '99999999-9999-9999-9999-000000000001';

update coffee_products
set brewing_notes = 'Serbaguna. Cocok untuk espresso dan filter.'
where id = '99999999-9999-9999-9999-000000000002';

update coffee_products
set brewing_notes = 'Cocok untuk minuman berbasis susu.'
where id = '99999999-9999-9999-9999-000000000003';

update coffee_products
set brewing_notes = 'Dirancang untuk minuman signature P1NTO.'
where id = '99999999-9999-9999-9999-000000000004';

-- ============ Opsi produk ============
update product_options
set name = 'Ukuran'
where id = '66666666-6666-6666-6666-000000000001';

update product_options
set name = 'Es'
where id = '66666666-6666-6666-6666-000000000002';

update product_options
set name = 'Gula'
where id = '66666666-6666-6666-6666-000000000003';

update product_option_values
set name = 'Sedikit'
where id = '524c8a80-8863-4528-8700-85b9cd0eeb64';

update product_option_values
set name = 'Tidak Ada'
where id = '43c96d61-dce0-4aa6-9cac-31cd80669af7';

update product_option_values
set name = 'Sedikit'
where id = '63d942e4-c2fd-4813-a43b-33f925dd299d';

commit;

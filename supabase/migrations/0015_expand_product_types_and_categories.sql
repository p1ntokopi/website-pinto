-- 0015_expand_product_types_and_categories.sql
-- Tambahkan tipe produk baru agar menu Pinto Kupi terklasifikasi secara presisi.
--   - DESSERT : Es krim, Affogato, dll.
--   - SERVICE : Layanan jasa roastery (giling / sangrai kopi).

begin;

alter type public.product_type add value if not exists 'DESSERT';
alter type public.product_type add value if not exists 'SERVICE';

commit;
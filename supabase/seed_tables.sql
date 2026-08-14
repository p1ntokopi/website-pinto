-- Seed Data for Tables
insert into public.tables (table_number, name, slug, capacity, is_active) values 
(1, 'Table 1', 'table-01', 2, true),
(2, 'Table 2', 'table-02', 2, true),
(3, 'Table 3', 'table-03', 4, true),
(4, 'Table 4', 'table-04', 4, true),
(5, 'Table 5', 'table-05', 4, true),
(6, 'Table 6', 'table-06', 4, true),
(7, 'Table 7', 'table-07', 6, true),
(8, 'Table 8', 'table-08', 6, true),
(9, 'Table 9', 'table-09', 8, true),
(10, 'Table 10', 'table-10', 8, true)
on conflict (table_number) do update set slug = excluded.slug, name = excluded.name;

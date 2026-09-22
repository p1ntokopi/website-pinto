-- 0035_request_beans_option.sql
-- Add "Pilihan Biji" product option group with "Request Beans (+5k)"
-- to the 5 designated black coffee items:
-- 1. V-60 (slug: 'v-60')
-- 2. Japanese (slug: 'japanese')
-- 3. Americano (slug: 'americano')
-- 4. Longblack (slug: 'longblack')
-- 5. Espresso (slug: 'espresso')

-- Bersihkan duplikat Pilihan Biji jika sebelumnya sempat ter-insert lebih dari sekali
delete from public.product_options
where id in (
  select id from (
    select id, row_number() over (partition by product_id, name order by created_at asc) as rn
    from public.product_options
    where name = 'Pilihan Biji'
  ) t
  where t.rn > 1
);

do $$
declare
  v_prod record;
  v_opt_id uuid;
begin
  for v_prod in
    select id, slug, name
    from public.products
    where slug in ('v-60', 'japanese', 'americano', 'longblack', 'espresso')
  loop
    -- Check if 'Pilihan Biji' already exists for this product
    select id into v_opt_id
    from public.product_options
    where product_id = v_prod.id and name = 'Pilihan Biji';

    if v_opt_id is null then
      insert into public.product_options (product_id, name, is_required, sort_order)
      values (v_prod.id, 'Pilihan Biji', true, 2)
      returning id into v_opt_id;
    else
      update public.product_options
      set is_required = true, sort_order = 2
      where id = v_opt_id;
    end if;

    -- Value 1: House Blend (Standar) -> price_adjustment = 0
    if not exists (
      select 1 from public.product_option_values
      where product_option_id = v_opt_id and name = 'House Blend (Standar)'
    ) then
      insert into public.product_option_values (product_option_id, name, price_adjustment, sort_order, is_available)
      values (v_opt_id, 'House Blend (Standar)', 0, 1, true);
    else
      update public.product_option_values
      set price_adjustment = 0, sort_order = 1, is_available = true
      where product_option_id = v_opt_id and name = 'House Blend (Standar)';
    end if;

    -- Value 2: Request Beans -> price_adjustment = 5000
    if not exists (
      select 1 from public.product_option_values
      where product_option_id = v_opt_id and name = 'Request Beans'
    ) then
      insert into public.product_option_values (product_option_id, name, price_adjustment, sort_order, is_available)
      values (v_opt_id, 'Request Beans', 5000, 2, true);
    else
      update public.product_option_values
      set price_adjustment = 5000, sort_order = 2, is_available = true
      where product_option_id = v_opt_id and name = 'Request Beans';
    end if;
  end loop;
end $$;

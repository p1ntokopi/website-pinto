-- 0011_m3_ordering.sql

create or replace function public.create_customer_order(
  p_table_slug text,
  p_session_token text,
  p_customer_name text,
  p_notes text,
  p_items jsonb
) returns jsonb as $$
declare
  v_table_id uuid;
  v_session_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_total_amount numeric := 0;
  v_subtotal numeric := 0;
  v_item jsonb;
  v_product_id uuid;
  v_variant_id uuid;
  v_quantity int;
  v_item_notes text;
  v_item_options jsonb;
  v_option jsonb;
  v_product_record record;
  v_variant_record record;
  v_unit_price numeric;
  v_item_subtotal numeric;
  v_order_item_id uuid;
  v_option_id uuid;
  v_option_value_id uuid;
  v_option_record record;
  v_val_record record;
  v_option_price numeric;
  v_item_total_option_price numeric;
begin
  -- 1. Validate Table
  select id into v_table_id from public.tables 
  where slug = p_table_slug and is_active = true;
  
  if v_table_id is null then
    raise exception 'Invalid or inactive table';
  end if;

  -- 2. Validate Session
  select id into v_session_id from public.dining_sessions 
  where table_id = v_table_id and session_token = p_session_token and status = 'open';
  
  if v_session_id is null then
    raise exception 'Invalid or expired dining session';
  end if;

  -- 3. Generate Order Number
  -- Format: Pinto-YYMMDD-XXXX
  v_order_number := 'Pinto-' || to_char(now(), 'YYMMDD') || '-' || lpad(cast(floor(random() * 10000) as text), 4, '0');
  -- In a real production system, use a sequence for the XXXX part to guarantee uniqueness without collision loops.
  -- For M3, random is sufficient but we should catch unique violations if they occur (rare for 10000).

  -- 4. Create Order Record (Initial)
  insert into public.orders (
    order_number,
    order_type,
    fulfillment_type,
    table_id,
    dining_session_id,
    customer_name,
    notes,
    status
  ) values (
    v_order_number,
    'DINE_IN',
    'SERVE_TO_TABLE',
    v_table_id,
    v_session_id,
    p_customer_name,
    p_notes,
    'PENDING'
  ) returning id into v_order_id;

  -- 5. Process Items
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;
    v_item_notes := v_item->>'notes';
    v_item_options := v_item->'options';
    v_item_total_option_price := 0;

    if v_quantity <= 0 or v_quantity > 50 then
      raise exception 'Invalid quantity';
    end if;

    -- Get Product
    select * into v_product_record from public.products 
    where id = v_product_id and is_available = true;
    
    if not found then
      raise exception 'Product not found or unavailable';
    end if;

    v_unit_price := v_product_record.base_price;

    -- Get Variant if exists
    if v_variant_id is not null then
      select * into v_variant_record from public.product_variants 
      where id = v_variant_id and product_id = v_product_id and is_available = true;
      
      if not found then
        raise exception 'Variant not found or unavailable';
      end if;
      
      v_unit_price := v_variant_record.price;
    end if;

    -- Insert Order Item (Initial, without options subtotal)
    insert into public.order_items (
      order_id,
      product_id,
      product_name_snapshot,
      variant_name_snapshot,
      quantity,
      unit_price,
      subtotal,
      notes
    ) values (
      v_order_id,
      v_product_id,
      v_product_record.name,
      v_variant_record.name, -- will be null if no variant
      v_quantity,
      v_unit_price,
      0, -- updated later
      v_item_notes
    ) returning id into v_order_item_id;

    -- Process Options
    if v_item_options is not null and jsonb_array_length(v_item_options) > 0 then
      for v_option in select * from jsonb_array_elements(v_item_options)
      loop
        v_option_id := (v_option->>'option_id')::uuid;
        v_option_value_id := (v_option->>'option_value_id')::uuid;

        -- Validate Option and Value
        select * into v_option_record from public.product_options
        where id = v_option_id and product_id = v_product_id;
        
        if not found then
          raise exception 'Invalid option for this product';
        end if;

        select * into v_val_record from public.product_option_values
        where id = v_option_value_id and product_option_id = v_option_id and is_available = true;

        if not found then
          raise exception 'Invalid option value';
        end if;

        v_option_price := v_val_record.price_adjustment;
        v_item_total_option_price := v_item_total_option_price + v_option_price;

        -- Insert Option Snapshot
        insert into public.order_item_options (
          order_item_id,
          option_name_snapshot,
          option_value_snapshot,
          price_adjustment
        ) values (
          v_order_item_id,
          v_option_record.name,
          v_val_record.name,
          v_option_price
        );
      end loop;
    end if;

    -- Calculate item total: (unit_price + options) * quantity
    v_item_subtotal := (v_unit_price + v_item_total_option_price) * v_quantity;
    
    -- Update item subtotal
    update public.order_items set subtotal = v_item_subtotal where id = v_order_item_id;

    -- Add to global total
    v_total_amount := v_total_amount + v_item_subtotal;
  end loop;

  -- 6. Finalize Order Totals
  update public.orders 
  set 
    subtotal = v_total_amount,
    total = v_total_amount -- M3 simplified: no tax/service fee
  where id = v_order_id;

  return jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number
  );
exception
  when others then
    return jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
end;
$$ language plpgsql security definer;

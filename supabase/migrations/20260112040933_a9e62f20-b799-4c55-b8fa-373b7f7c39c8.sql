-- Create atomic order function to prevent race conditions
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_user_id uuid,
  p_total numeric,
  p_shipping_address jsonb,
  p_payment_method text,
  p_items jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_current_stock integer;
  v_product_name text;
BEGIN
  -- Validate user_id is not null (guest checkout disabled)
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be logged in to place an order';
  END IF;

  -- Lock rows and validate stock atomically
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT stock_quantity, name INTO v_current_stock, v_product_name
    FROM products
    WHERE id = (v_item->>'id')::uuid
      AND in_stock = true
    FOR UPDATE;  -- Row lock prevents concurrent modifications
    
    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Product "%" is not available', COALESCE(v_product_name, v_item->>'name');
    END IF;
    
    IF v_current_stock < (v_item->>'quantity')::int THEN
      RAISE EXCEPTION 'Insufficient stock for "%". Only % available.', COALESCE(v_product_name, v_item->>'name'), v_current_stock;
    END IF;
    
    -- Atomic stock update
    UPDATE products
    SET stock_quantity = stock_quantity - (v_item->>'quantity')::int,
        in_stock = (stock_quantity - (v_item->>'quantity')::int) > 0,
        updated_at = now()
    WHERE id = (v_item->>'id')::uuid;
  END LOOP;
  
  -- Create order after securing stock
  INSERT INTO orders (user_id, status, total, shipping_address, payment_method, items)
  VALUES (
    p_user_id,
    'pending',
    p_total,
    p_shipping_address,
    p_payment_method,
    p_items
  ) RETURNING id INTO v_order_id;
  
  RETURN jsonb_build_object('order_id', v_order_id);
EXCEPTION
  WHEN OTHERS THEN
    -- Transaction automatically rolls back on exception
    RAISE;
END;
$$;
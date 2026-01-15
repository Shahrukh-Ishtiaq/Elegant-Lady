-- Fix the create_order_atomic function to use SECURITY DEFINER
-- This allows normal users to place orders by updating stock atomically

CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_user_id uuid,
  p_total numeric,
  p_shipping_address jsonb,
  p_payment_method text,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_current_stock integer;
  v_product_name text;
  v_product_in_stock boolean;
  v_product_exists boolean;
BEGIN
  -- Validate user_id is not null (guest checkout disabled)
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be logged in to place an order';
  END IF;

  -- Verify the calling user matches the user_id parameter (security check)
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only place orders for yourself';
  END IF;

  -- Lock rows and validate stock atomically
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- First check if product exists at all
    SELECT EXISTS(SELECT 1 FROM products WHERE id = (v_item->>'id')::uuid) INTO v_product_exists;
    
    IF NOT v_product_exists THEN
      RAISE EXCEPTION 'Product "%" not found in our catalog', COALESCE(v_item->>'name', 'Unknown');
    END IF;
    
    -- Get product details with row lock
    SELECT stock_quantity, name, in_stock 
    INTO v_current_stock, v_product_name, v_product_in_stock
    FROM products
    WHERE id = (v_item->>'id')::uuid
    FOR UPDATE;
    
    -- Check if product is marked as in stock
    IF v_product_in_stock IS NOT TRUE THEN
      RAISE EXCEPTION 'Sorry, "%" is currently out of stock', v_product_name;
    END IF;
    
    -- Check if there's enough stock
    IF v_current_stock IS NULL OR v_current_stock <= 0 THEN
      RAISE EXCEPTION 'Sorry, "%" is currently out of stock', v_product_name;
    END IF;
    
    IF v_current_stock < (v_item->>'quantity')::int THEN
      RAISE EXCEPTION 'Sorry, only % units of "%" available in stock', v_current_stock, v_product_name;
    END IF;
    
    -- Atomic stock update
    UPDATE products
    SET stock_quantity = stock_quantity - (v_item->>'quantity')::int,
        in_stock = CASE WHEN (stock_quantity - (v_item->>'quantity')::int) > 0 THEN true ELSE false END,
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
  
  -- Clear the user's cart after successful order
  DELETE FROM cart_items WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object('order_id', v_order_id);
EXCEPTION
  WHEN OTHERS THEN
    -- Transaction automatically rolls back on exception
    RAISE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_order_atomic(uuid, numeric, jsonb, text, jsonb) TO authenticated;
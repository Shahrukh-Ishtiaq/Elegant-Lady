-- Fix SECURITY DEFINER functions with proper search_path (public, pg_temp)
-- This prevents search path attacks as defense-in-depth

-- Fix check_rate_limit function
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_identifier text, p_endpoint text, p_max_requests integer DEFAULT 5, p_window_minutes integer DEFAULT 60)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
DECLARE
  v_record rate_limits%ROWTYPE;
  v_window_start timestamp with time zone;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::interval;
  
  -- Try to get existing record
  SELECT * INTO v_record
  FROM rate_limits
  WHERE identifier = p_identifier AND endpoint = p_endpoint
  FOR UPDATE;
  
  IF NOT FOUND THEN
    -- No record exists, create one
    INSERT INTO rate_limits (identifier, endpoint, request_count, window_start)
    VALUES (p_identifier, p_endpoint, 1, now());
    RETURN true;
  END IF;
  
  -- Check if window has expired
  IF v_record.window_start < v_window_start THEN
    -- Reset the window
    UPDATE rate_limits
    SET request_count = 1, window_start = now()
    WHERE id = v_record.id;
    RETURN true;
  END IF;
  
  -- Check if under limit
  IF v_record.request_count < p_max_requests THEN
    -- Increment counter
    UPDATE rate_limits
    SET request_count = request_count + 1
    WHERE id = v_record.id;
    RETURN true;
  END IF;
  
  -- Rate limit exceeded
  RETURN false;
END;
$function$;

-- Fix cleanup_old_rate_limits function
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < now() - interval '24 hours';
END;
$function$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;

-- Fix create_order_atomic function
CREATE OR REPLACE FUNCTION public.create_order_atomic(p_user_id uuid, p_total numeric, p_shipping_address jsonb, p_payment_method text, p_items jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
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
$function$;
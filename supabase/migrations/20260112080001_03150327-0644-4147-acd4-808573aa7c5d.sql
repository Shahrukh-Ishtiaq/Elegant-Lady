-- Fix 1: Update has_role function to use more restrictive search_path (public, pg_temp)
-- This prevents temporary schema attacks when using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fix 2: Update orders INSERT policy to remove NULL user_id allowance
-- Guest checkout is disabled in the application, so the RLS policy should match
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;

CREATE POLICY "Users can create own orders" 
ON public.orders 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);
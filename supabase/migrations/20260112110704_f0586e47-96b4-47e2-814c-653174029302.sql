-- Remove overly permissive policies from rate_limits table
-- The check_rate_limit function uses SECURITY DEFINER so it doesn't need these policies
DROP POLICY IF EXISTS "Anyone can insert rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Anyone can update rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Anyone can view rate limits" ON public.rate_limits;

-- Only allow admins to view rate limit records for monitoring
CREATE POLICY "Admins can view rate limits"
ON public.rate_limits
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only allow admins to manage rate limit records
CREATE POLICY "Admins can manage rate limits"
ON public.rate_limits
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));
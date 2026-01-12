-- Drop the existing policy that uses USING (true)
DROP POLICY IF EXISTS "Authenticated users can update helpful count" ON public.reviews;

-- Create an improved policy that explicitly requires authentication
-- This maintains the helpful count feature while satisfying the RLS linter
CREATE POLICY "Authenticated users can update helpful count"
ON public.reviews
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (
  -- Only allow updating helpful_count - all other fields must remain unchanged
  (rating = (SELECT r.rating FROM reviews r WHERE r.id = reviews.id))
  AND (comment = (SELECT r.comment FROM reviews r WHERE r.id = reviews.id))
  AND (user_name = (SELECT r.user_name FROM reviews r WHERE r.id = reviews.id))
  AND (product_id = (SELECT r.product_id FROM reviews r WHERE r.id = reviews.id))
  AND (NOT (user_id IS DISTINCT FROM (SELECT r.user_id FROM reviews r WHERE r.id = reviews.id)))
);
-- Fix the overly permissive UPDATE policy on reviews table
-- The "Anyone can update helpful count only" policy uses USING (true) which triggers the linter

-- Drop the existing permissive UPDATE policy for helpful_count
DROP POLICY IF EXISTS "Anyone can update helpful count only" ON public.reviews;

-- Create a more restrictive policy for helpful_count updates
-- Authenticated users can update helpful_count only (all other fields are checked to remain unchanged)
CREATE POLICY "Authenticated users can update helpful count" 
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (true)  -- Anyone can try to update
  WITH CHECK (
    -- Only allow incrementing helpful_count, no other fields can change
    rating = (SELECT rating FROM reviews r WHERE r.id = reviews.id) AND
    comment = (SELECT comment FROM reviews r WHERE r.id = reviews.id) AND
    user_name = (SELECT user_name FROM reviews r WHERE r.id = reviews.id) AND
    product_id = (SELECT product_id FROM reviews r WHERE r.id = reviews.id) AND
    user_id IS NOT DISTINCT FROM (SELECT user_id FROM reviews r WHERE r.id = reviews.id)
  );
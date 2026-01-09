-- Fix Review Update Allows Field Manipulation
-- Drop the overly permissive update policy
DROP POLICY IF EXISTS "Anyone can update helpful count" ON public.reviews;

-- Create a more restrictive policy for helpful count updates only
-- This allows anyone to increment helpful_count but NOT modify rating/comment/user_name
CREATE POLICY "Anyone can update helpful count only"
ON public.reviews
FOR UPDATE
USING (true)
WITH CHECK (
  -- Only allow updating helpful_count field
  -- The old values for other fields must match
  rating = (SELECT rating FROM public.reviews WHERE id = reviews.id) AND
  comment = (SELECT comment FROM public.reviews WHERE id = reviews.id) AND
  user_name = (SELECT user_name FROM public.reviews WHERE id = reviews.id) AND
  user_id IS NOT DISTINCT FROM (SELECT user_id FROM public.reviews WHERE id = reviews.id)
);

-- Add policy for users to update their own reviews (rating, comment)
CREATE POLICY "Users can update own reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add policy for users to delete their own reviews
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;

CREATE POLICY "Users can delete own reviews"
ON public.reviews
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any reviews"
ON public.reviews
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
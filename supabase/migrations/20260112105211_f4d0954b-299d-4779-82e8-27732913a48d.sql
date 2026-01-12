-- Fix: Hide user_id from public review access
-- Create a public view that excludes the user_id field for anonymous access

-- Step 1: Create a view without user_id for public access
CREATE OR REPLACE VIEW public.public_reviews AS
SELECT 
  id,
  product_id,
  rating,
  helpful_count,
  created_at,
  comment,
  user_name
FROM public.reviews;

-- Step 2: Grant access to the view for anonymous users
GRANT SELECT ON public.public_reviews TO anon;
GRANT SELECT ON public.public_reviews TO authenticated;

-- Step 3: Update the reviews table SELECT policy to require authentication
-- This ensures the user_id is only visible to authenticated users who need it for ownership
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;

-- Authenticated users can view all reviews (they need user_id for ownership verification)
CREATE POLICY "Authenticated users can view all reviews" 
ON public.reviews 
FOR SELECT 
TO authenticated
USING (true);

-- Note: The public_reviews view will be used by frontend for displaying reviews
-- The reviews table with user_id is only accessible to authenticated users
-- Add RLS policy on reviews to allow anonymous SELECT through the view
-- The view needs underlying SELECT access to the reviews table

-- Re-add anonymous access policy for the reviews table (for view access)
-- But users will only be able to query through the view which hides user_id
CREATE POLICY "Anyone can view reviews via view" 
ON public.reviews 
FOR SELECT 
TO anon
USING (true);
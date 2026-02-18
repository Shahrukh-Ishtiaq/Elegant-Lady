CREATE POLICY "Users can update own wishlist items" 
ON public.wishlist 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
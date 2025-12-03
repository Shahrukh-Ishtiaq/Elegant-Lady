-- Make stock bucket public for product images
UPDATE storage.buckets 
SET public = true 
WHERE id = 'stock';

-- Create storage policy for authenticated admin uploads
CREATE POLICY "Admin can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'stock' 
  AND (storage.foldername(name))[1] = 'products'
  AND public.has_role(auth.uid(), 'admin')
);

-- Create policy for public read access
CREATE POLICY "Public can view product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'stock');

-- Create policy for admin delete
CREATE POLICY "Admin can delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'stock' 
  AND public.has_role(auth.uid(), 'admin')
);
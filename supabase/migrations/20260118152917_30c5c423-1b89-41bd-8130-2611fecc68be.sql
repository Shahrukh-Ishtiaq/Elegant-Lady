-- Add hero_images array column to site_settings
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_images text[] DEFAULT '{}';

-- Add is_frozen column to products table for freeze/unfreeze feature
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_frozen boolean DEFAULT false;

-- Create site_images storage bucket for hero images
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('site_images', 'site_images', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for site_images bucket
CREATE POLICY "Public can view site images"
ON storage.objects FOR SELECT
USING (bucket_id = 'site_images');

CREATE POLICY "Admins can upload site images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'site_images' AND
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

CREATE POLICY "Admins can update site images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'site_images' AND
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

CREATE POLICY "Admins can delete site images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'site_images' AND
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);
-- Add delivery charges columns to site_settings for admin-configurable shipping
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS delivery_charge numeric DEFAULT 250,
ADD COLUMN IF NOT EXISTS free_shipping_threshold numeric DEFAULT 5000;

-- Update existing row with default values
UPDATE public.site_settings 
SET delivery_charge = 250, free_shipping_threshold = 5000 
WHERE id = 'main';
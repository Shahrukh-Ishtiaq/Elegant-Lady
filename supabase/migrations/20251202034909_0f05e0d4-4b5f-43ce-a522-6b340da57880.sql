-- Add promotional fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS discount_percentage integer DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_new boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS original_price numeric;

-- Update original_price for existing products (set to current price)
UPDATE public.products SET original_price = price WHERE original_price IS NULL;
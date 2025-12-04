-- Create promotions table for admin-managed banners
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  discount_percentage INTEGER,
  badge_text TEXT DEFAULT '30% OFF',
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Public can view active promotions
CREATE POLICY "Anyone can view active promotions"
ON public.promotions
FOR SELECT
USING (is_active = true);

-- Only admins can manage promotions
CREATE POLICY "Admins can manage promotions"
ON public.promotions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_promotions_updated_at
BEFORE UPDATE ON public.promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert a default promotion
INSERT INTO public.promotions (title, description, discount_percentage, badge_text, is_active)
VALUES ('Summer Sale', 'Up to 30% off on selected items', 30, '30% OFF', true);
-- Fix: Set view to use SECURITY INVOKER (the default, safer option)
-- This ensures the view respects the querying user's permissions
ALTER VIEW public.public_reviews SET (security_invoker = on);
-- Create admin allowlist table to grant admin access by email (server-side)
CREATE TABLE IF NOT EXISTS public.admin_allowlist (
  email TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL
);

ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;

-- Only admins can manage allowlist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'admin_allowlist' 
      AND policyname = 'Admins can manage admin allowlist'
  ) THEN
    CREATE POLICY "Admins can manage admin allowlist"
    ON public.admin_allowlist
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::public.app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;

-- Seed the requested admin email
INSERT INTO public.admin_allowlist (email, enabled)
VALUES ('infodaisy221@gmail.com', true)
ON CONFLICT (email) DO UPDATE SET enabled = EXCLUDED.enabled;
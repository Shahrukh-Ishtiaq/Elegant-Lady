-- Create a rate limiting table to track submissions by IP/identifier
CREATE TABLE public.rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier text NOT NULL,
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create unique constraint for identifier + endpoint combination
CREATE UNIQUE INDEX idx_rate_limits_identifier_endpoint ON public.rate_limits (identifier, endpoint);

-- Create index for cleanup queries
CREATE INDEX idx_rate_limits_window_start ON public.rate_limits (window_start);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert rate limit records (for tracking)
CREATE POLICY "Anyone can insert rate limits"
ON public.rate_limits
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update their own rate limit records
CREATE POLICY "Anyone can update rate limits"
ON public.rate_limits
FOR UPDATE
USING (true);

-- Allow anyone to select rate limits (needed for checking)
CREATE POLICY "Anyone can view rate limits"
ON public.rate_limits
FOR SELECT
USING (true);

-- Create function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_endpoint text,
  p_max_requests integer DEFAULT 5,
  p_window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record rate_limits%ROWTYPE;
  v_window_start timestamp with time zone;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::interval;
  
  -- Try to get existing record
  SELECT * INTO v_record
  FROM rate_limits
  WHERE identifier = p_identifier AND endpoint = p_endpoint
  FOR UPDATE;
  
  IF NOT FOUND THEN
    -- No record exists, create one
    INSERT INTO rate_limits (identifier, endpoint, request_count, window_start)
    VALUES (p_identifier, p_endpoint, 1, now());
    RETURN true;
  END IF;
  
  -- Check if window has expired
  IF v_record.window_start < v_window_start THEN
    -- Reset the window
    UPDATE rate_limits
    SET request_count = 1, window_start = now()
    WHERE id = v_record.id;
    RETURN true;
  END IF;
  
  -- Check if under limit
  IF v_record.request_count < p_max_requests THEN
    -- Increment counter
    UPDATE rate_limits
    SET request_count = request_count + 1
    WHERE id = v_record.id;
    RETURN true;
  END IF;
  
  -- Rate limit exceeded
  RETURN false;
END;
$$;

-- Update contact_messages INSERT policy to include rate limiting
DROP POLICY IF EXISTS "Anyone can submit contact with validation" ON public.contact_messages;

CREATE POLICY "Anyone can submit contact with rate limit"
ON public.contact_messages
FOR INSERT
WITH CHECK (
  (length(name) <= 200) AND 
  (length(name) >= 1) AND 
  (length(email) <= 255) AND 
  (length(email) >= 5) AND 
  (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text) AND 
  (length(subject) <= 500) AND 
  (length(subject) >= 1) AND 
  (length(message) <= 5000) AND 
  (length(message) >= 1) AND
  check_rate_limit(email, 'contact_messages', 3, 60)
);

-- Update subscribers INSERT policy to include rate limiting
DROP POLICY IF EXISTS "Anyone can subscribe with validation" ON public.subscribers;

CREATE POLICY "Anyone can subscribe with rate limit"
ON public.subscribers
FOR INSERT
WITH CHECK (
  (length(email) <= 255) AND 
  (length(email) >= 5) AND 
  (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text) AND
  check_rate_limit(email, 'subscribers', 3, 60)
);

-- Create cleanup function for old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < now() - interval '24 hours';
END;
$$;
-- Add field length validation to subscribers policy
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.subscribers;
CREATE POLICY "Anyone can subscribe with validation" ON public.subscribers 
  FOR INSERT WITH CHECK (
    length(email) <= 255 AND
    length(email) >= 5 AND
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

-- Add field length validation to contact_messages policy
DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact with validation" ON public.contact_messages 
  FOR INSERT WITH CHECK (
    length(name) <= 200 AND
    length(name) >= 1 AND
    length(email) <= 255 AND
    length(email) >= 5 AND
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
    length(subject) <= 500 AND
    length(subject) >= 1 AND
    length(message) <= 5000 AND
    length(message) >= 1
  );
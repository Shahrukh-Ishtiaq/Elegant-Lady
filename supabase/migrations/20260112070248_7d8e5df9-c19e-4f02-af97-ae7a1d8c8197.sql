-- Fix overly permissive INSERT policy on reviews table
-- This addresses: SUPA_rls_policy_always_true and INPUT_VALIDATION issues

-- Drop the existing permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;

-- Create new INSERT policy with validation checks
-- This replaces WITH CHECK (true) with proper validation
CREATE POLICY "Authenticated users can create reviews with validation" 
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Ensure user_id matches authenticated user
    auth.uid() = user_id AND
    -- Validate user_name length (1-100 chars)
    length(user_name) >= 1 AND length(user_name) <= 100 AND
    -- Validate comment length (1-1000 chars, accommodating existing data)
    length(comment) >= 1 AND length(comment) <= 1000 AND
    -- Validate rating range (already has CHECK constraint but adding for completeness)
    rating >= 1 AND rating <= 5
  );
-- Fix promoter self-linking policies to avoid querying auth.users (which can break RLS evaluation)

-- Drop the unsafe policies if they exist
DROP POLICY IF EXISTS "Allow promoter lookup by email for linking" ON public.promoters;
DROP POLICY IF EXISTS "Allow promoter self-linking" ON public.promoters;

-- Recreate safe policies using the email claim from the JWT
-- Note: auth.jwt() returns the JWT claims as jsonb
CREATE POLICY "Allow promoter lookup by email for linking"
ON public.promoters
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND user_id IS NULL
  AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

CREATE POLICY "Allow promoter self-linking"
ON public.promoters
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND user_id IS NULL
  AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
WITH CHECK (
  user_id = auth.uid()
);
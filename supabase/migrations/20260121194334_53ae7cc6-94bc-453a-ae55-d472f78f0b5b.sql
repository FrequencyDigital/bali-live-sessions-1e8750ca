-- Allow authenticated users to view their promoter record by email (for initial linking)
CREATE POLICY "Allow promoter lookup by email for linking"
ON public.promoters
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND user_id IS NULL
);

-- Allow authenticated users to update their own promoter record to link user_id
CREATE POLICY "Allow promoter self-linking"
ON public.promoters
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND user_id IS NULL
)
WITH CHECK (
  user_id = auth.uid()
);
-- Add DELETE policy for super_admins to revoke commission entries
CREATE POLICY "Super admins can delete commissions"
ON public.commission_ledger
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));
-- Fix function search_path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Fix RLS policy for qr_scans to be more specific
DROP POLICY IF EXISTS "Anyone can insert qr_scans" ON public.qr_scans;

CREATE POLICY "Authenticated users can insert qr_scans"
ON public.qr_scans FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.promoters WHERE id = promoter_id AND is_active = true
    )
);
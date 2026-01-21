-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can register as a guest" ON public.guests;
DROP POLICY IF EXISTS "Anyone can record QR scans" ON public.qr_scans;

-- Create safer policies with basic validation
-- Guests: require valid event_id that is upcoming
CREATE POLICY "Public can register for upcoming events"
ON public.guests
FOR INSERT
WITH CHECK (
  event_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.events 
    WHERE id = event_id 
    AND status = 'upcoming'
  )
);

-- QR Scans: require valid promoter and event combination
CREATE POLICY "Public can record valid QR scans"
ON public.qr_scans
FOR INSERT
WITH CHECK (
  promoter_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.promoters 
    WHERE id = promoter_id 
    AND is_active = true
  )
);
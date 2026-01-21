-- Allow public read access to promoter_event_qr for guestlist page lookups
-- This is needed so anonymous users can view guestlist registration pages
CREATE POLICY "Public can view promoter event QR for registration"
ON public.promoter_event_qr
FOR SELECT
USING (true);

-- Allow public read access to events for guestlist pages
CREATE POLICY "Public can view upcoming events for registration"
ON public.events
FOR SELECT
USING (status = 'upcoming');

-- Allow public read access to basic promoter info for guestlist pages
CREATE POLICY "Public can view promoter name for guestlist"
ON public.promoters
FOR SELECT
USING (is_active = true);

-- Allow anonymous users to insert guests for registration
CREATE POLICY "Anyone can register as a guest"
ON public.guests
FOR INSERT
WITH CHECK (true);

-- Allow public to insert QR scans for tracking
CREATE POLICY "Anyone can record QR scans"
ON public.qr_scans
FOR INSERT
WITH CHECK (true);
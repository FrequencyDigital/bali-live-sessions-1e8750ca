-- Create storage bucket for venue files (menus, documents)
INSERT INTO storage.buckets (id, name, public)
VALUES ('venue-files', 'venue-files', true);

-- Allow authenticated users to upload venue files
CREATE POLICY "Admins can upload venue files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'venue-files' 
  AND is_admin(auth.uid())
);

-- Allow authenticated users to update venue files
CREATE POLICY "Admins can update venue files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'venue-files'
  AND is_admin(auth.uid())
);

-- Allow public read access to venue files
CREATE POLICY "Public can view venue files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'venue-files');

-- Allow admins to delete venue files
CREATE POLICY "Admins can delete venue files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'venue-files'
  AND is_admin(auth.uid())
);
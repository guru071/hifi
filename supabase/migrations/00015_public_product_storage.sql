-- Create the storage bucket for public product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read access to product images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Allow authenticated admins to upload/modify product images
CREATE POLICY "Admin Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products' AND (auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admin Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products' AND (auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admin Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products' AND (auth.jwt() ->> 'role') = 'admin');

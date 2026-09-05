-- Create the storage bucket for public product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read access to product images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public Access'
  ) THEN
    CREATE POLICY "Public Access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'products');
  END IF;
END $$;

-- Allow authenticated admins to upload/modify product images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admin Upload Access'
  ) THEN
    CREATE POLICY "Admin Upload Access"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'products' AND (auth.jwt() ->> 'role') = 'admin');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admin Update Access'
  ) THEN
    CREATE POLICY "Admin Update Access"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'products' AND (auth.jwt() ->> 'role') = 'admin');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admin Delete Access'
  ) THEN
    CREATE POLICY "Admin Delete Access"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'products' AND (auth.jwt() ->> 'role') = 'admin');
  END IF;
END $$;

-- Ensure storage buckets exist
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio', 'portfolio', true) ON CONFLICT (id) DO NOTHING;

-- Policies for "documents" bucket
-- Allow authenticated users to upload their own documents (insert)
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[2]);

-- Allow authenticated users to update their own documents
DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
CREATE POLICY "Authenticated users can update documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[2]);

-- Allow authenticated users to delete their own documents
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;
CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[2]);

-- Allow authenticated users (Admins) to read documents
DROP POLICY IF EXISTS "Authenticated users can read documents" ON storage.objects;
CREATE POLICY "Authenticated users can read documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');


-- Policies for "portfolio" bucket
-- Allow authenticated users to upload portfolio items
DROP POLICY IF EXISTS "Authenticated users can upload portfolio" ON storage.objects;
CREATE POLICY "Authenticated users can upload portfolio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[2]);

-- Allow authenticated users to read portfolio items
DROP POLICY IF EXISTS "Anyone can read portfolio" ON storage.objects;
CREATE POLICY "Anyone can read portfolio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio');

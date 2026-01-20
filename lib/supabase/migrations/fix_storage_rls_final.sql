-- FINAL STORAGE FIX: Simplify RLS to avoid 'foldername' function dependency
-- This uses standard string concatenation and pattern matching which is more robust.

-- 1. Documents Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND 
    (name LIKE 'providers/' || auth.uid() || '/%')
  );

DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
CREATE POLICY "Authenticated users can update documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'documents' AND 
    (name LIKE 'providers/' || auth.uid() || '/%')
  );

DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;
CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND 
    (name LIKE 'providers/' || auth.uid() || '/%')
  );

DROP POLICY IF EXISTS "Authenticated users can read documents" ON storage.objects;
CREATE POLICY "Authenticated users can read documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');


-- 2. Portfolio Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio', 'portfolio', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload portfolio" ON storage.objects;
CREATE POLICY "Authenticated users can upload portfolio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'portfolio' AND 
    (name LIKE 'portfolio/' || auth.uid() || '/%')
  );

DROP POLICY IF EXISTS "Authenticated users can update portfolio" ON storage.objects;
CREATE POLICY "Authenticated users can update portfolio"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'portfolio' AND 
    (name LIKE 'portfolio/' || auth.uid() || '/%')
  );

DROP POLICY IF EXISTS "Authenticated users can delete portfolio" ON storage.objects;
CREATE POLICY "Authenticated users can delete portfolio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'portfolio' AND 
    (name LIKE 'portfolio/' || auth.uid() || '/%')
  );

DROP POLICY IF EXISTS "Anyone can read portfolio" ON storage.objects;
CREATE POLICY "Anyone can read portfolio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio');

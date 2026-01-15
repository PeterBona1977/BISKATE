-- Create Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio', 'portfolio', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
SELECT EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid() AND role = 'admin'
);
$$ LANGUAGE sql SECURITY DEFINER;

-- Portfolio Policies (Public View, Auth Upload)
CREATE POLICY "Public View Portfolio" ON storage.objects FOR SELECT USING (bucket_id = 'portfolio');
CREATE POLICY "Auth Upload Portfolio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'portfolio' AND auth.role() = 'authenticated');
CREATE POLICY "Owner Delete Portfolio" ON storage.objects FOR DELETE USING (bucket_id = 'portfolio' AND auth.uid() = owner);

-- Documents Policies (Private: Owner/Admin View, Auth Upload)
CREATE POLICY "Auth Upload Documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Owner View Documents" ON storage.objects FOR SELECT USING (
    bucket_id = 'documents' AND (auth.uid() = owner)
);

CREATE POLICY "Admin View Documents" ON storage.objects FOR SELECT USING (
    bucket_id = 'documents' AND public.is_admin()
);

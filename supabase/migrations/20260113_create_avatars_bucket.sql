-- Create Avatars Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

-- Avatars Policies (Public View, Auth Upload)
CREATE POLICY "Public View Avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Auth Upload Avatars" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Owner Update Avatars" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "Owner Delete Avatars" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid() = owner);

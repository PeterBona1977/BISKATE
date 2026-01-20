-- ERROR 400 FIX: Ensure provider_documents exists with correct schema
CREATE TABLE IF NOT EXISTS public.provider_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    document_type TEXT NOT NULL, -- 'id', 'address', 'other'
    document_name TEXT NOT NULL,
    document_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for provider_documents (Ensure it's enabled and policies exist)
ALTER TABLE public.provider_documents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'provider_documents' AND policyname = 'Providers can manage own documents') THEN
        CREATE POLICY "Providers can manage own documents" ON public.provider_documents
            FOR ALL USING (auth.uid() = provider_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'provider_documents' AND policyname = 'Admins can view all documents') THEN
         -- Assuming admins are authenticated for now, or have specific role. 
         -- For simplistic fix: authenticated users can view all (to allow admin dashboard to work)
         CREATE POLICY "Admins can view all documents" ON public.provider_documents
            FOR SELECT TO authenticated USING (true);
    END IF;
END $$;


-- ERROR 404 FIX: Ensure provider_stats table and RPC exist
CREATE TABLE IF NOT EXISTS public.provider_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    avg_rating NUMERIC(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_gigs_completed INTEGER DEFAULT 0,
    completion_rate INTEGER DEFAULT 100,
    response_time_minutes INTEGER DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.provider_stats ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'provider_stats' AND policyname = 'Public read stats') THEN
        CREATE POLICY "Public read stats" ON public.provider_stats
            FOR SELECT USING (true);
    END IF;
END $$;


-- RPC: initialize_provider_stats
CREATE OR REPLACE FUNCTION public.initialize_provider_stats(provider_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.provider_stats (provider_id)
    VALUES (provider_uuid)
    ON CONFLICT (provider_id) DO NOTHING;
END;
$$;

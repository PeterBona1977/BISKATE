-- FORCE FIX: Ensure columns exist in provider_documents
-- The table might exist with wrong column names (e.g. 'type' instead of 'document_type')
-- This script ensures the expected columns are present.

DO $$
BEGIN
    -- 1. Ensure 'provider_id' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_documents' AND column_name = 'provider_id') THEN
        ALTER TABLE public.provider_documents ADD COLUMN provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- 2. Ensure 'document_type' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_documents' AND column_name = 'document_type') THEN
        ALTER TABLE public.provider_documents ADD COLUMN document_type TEXT;
    END IF;

    -- 3. Ensure 'document_name' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_documents' AND column_name = 'document_name') THEN
        ALTER TABLE public.provider_documents ADD COLUMN document_name TEXT;
    END IF;

    -- 4. Ensure 'document_url' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_documents' AND column_name = 'document_url') THEN
        ALTER TABLE public.provider_documents ADD COLUMN document_url TEXT;
    END IF;

    -- 5. Ensure 'status' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_documents' AND column_name = 'status') THEN
        ALTER TABLE public.provider_documents ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;

    -- 6. Ensure 'rejection_reason' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_documents' AND column_name = 'rejection_reason') THEN
        ALTER TABLE public.provider_documents ADD COLUMN rejection_reason TEXT;
    END IF;

    -- 7. Ensure 'created_at' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_documents' AND column_name = 'created_at') THEN
        ALTER TABLE public.provider_documents ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    END IF;

END $$;

-- Also verify RLS one more time just in case
ALTER TABLE public.provider_documents ENABLE ROW LEVEL SECURITY;

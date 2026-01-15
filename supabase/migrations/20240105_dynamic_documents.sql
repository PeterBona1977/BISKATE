-- Add description column to provider_documents
ALTER TABLE public.provider_documents ADD COLUMN IF NOT EXISTS description TEXT;

-- Update document_type check constraint to include 'other'
-- First drop existing constraint
ALTER TABLE public.provider_documents DROP CONSTRAINT IF EXISTS provider_documents_document_type_check;

-- Add new constraint
ALTER TABLE public.provider_documents ADD CONSTRAINT provider_documents_document_type_check 
    CHECK (document_type IN ('id', 'certificate', 'insurance', 'other'));

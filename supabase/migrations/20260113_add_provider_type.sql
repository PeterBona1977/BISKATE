-- Add provider type and company name to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provider_type TEXT DEFAULT 'individual' CHECK (provider_type IN ('individual', 'company'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Update existing providers to have a default type
UPDATE public.profiles SET provider_type = 'individual' WHERE is_provider = true AND provider_type IS NULL;

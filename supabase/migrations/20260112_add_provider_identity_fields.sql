-- Add provider-specific identity fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provider_avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provider_full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vat_number TEXT;

-- Comment on columns for clarity
COMMENT ON COLUMN public.profiles.provider_avatar_url IS 'Avatar for the provider profile (e.g., company logo)';
COMMENT ON COLUMN public.profiles.provider_full_name IS 'Display name for the provider profile (e.g., company name)';
COMMENT ON COLUMN public.profiles.vat_number IS 'VAT registration number for business providers';

-- Add columns to profiles table for Enhanced Provider Onboarding
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provider_type text DEFAULT 'individual';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS commercial_registry_code text;
-- Ensure vat_number exists (it was likely already there but ensuring consistency)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vat_number text;

-- Comment on columns
COMMENT ON COLUMN public.profiles.provider_type IS 'Type of provider: individual or company';
COMMENT ON COLUMN public.profiles.company_name IS 'Name of the company if provider_type is company';
COMMENT ON COLUMN public.profiles.commercial_registry_code IS 'Access code for Certidão Permanente';

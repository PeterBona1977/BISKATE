-- Add company_responsible column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_responsible text;

-- Add description
COMMENT ON COLUMN public.profiles.company_responsible IS 'Name of the responsible person (manager/gerente) for the company';

-- Migration to add emergency calls column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS provider_emergency_calls BOOLEAN DEFAULT FALSE;

-- Update RLS if necessary (usually profiles are already covered for individual updates)
-- Adding a comment for clarity
COMMENT ON COLUMN profiles.provider_emergency_calls IS 'Indicador se o prestador realiza atendimentos de emergência';

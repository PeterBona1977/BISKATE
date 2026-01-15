-- Add provider_location to profiles table for complete separation from client location
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS provider_location TEXT;

-- Seed existing data if needed (optional, but good for consistency)
UPDATE profiles SET provider_location = location WHERE is_provider = true AND provider_location IS NULL;

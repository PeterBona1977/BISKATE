-- Add service radius and coordinates to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provider_service_radius INTEGER DEFAULT 20; -- Default 20km
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_lat DOUBLE PRECISION;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_lng DOUBLE PRECISION;

-- Comment for clarity
COMMENT ON COLUMN public.profiles.provider_service_radius IS 'Service radius in kilometers for the provider';

-- Add coordinates to gigs table
ALTER TABLE public.gigs ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE public.gigs ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- Index for spatial queries if needed (PostGIS would be better but we'll stick to basic)
CREATE INDEX IF NOT EXISTS idx_gigs_coords ON public.gigs(lat, lng);

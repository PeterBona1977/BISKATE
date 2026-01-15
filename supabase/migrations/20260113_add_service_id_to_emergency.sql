-- Add service_id to emergency_requests for better matching
ALTER TABLE public.emergency_requests ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.categories(id);

-- Update RLS if necessary
-- The existing policies should still cover this column.

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_emergency_requests_service_id ON public.emergency_requests(service_id);

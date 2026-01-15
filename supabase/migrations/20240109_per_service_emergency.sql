-- Create provider_emergency_services table to track emergency availability per service
CREATE TABLE IF NOT EXISTS public.provider_emergency_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  accepts_emergency BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(provider_id, category_id)
);

-- Enable RLS for provider_emergency_services
ALTER TABLE public.provider_emergency_services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure idempotency
DROP POLICY IF EXISTS "Providers can view their own emergency services" ON public.provider_emergency_services;
DROP POLICY IF EXISTS "Providers can insert their own emergency services" ON public.provider_emergency_services;
DROP POLICY IF EXISTS "Providers can update their own emergency services" ON public.provider_emergency_services;
DROP POLICY IF EXISTS "Providers can delete their own emergency services" ON public.provider_emergency_services;
DROP POLICY IF EXISTS "Public can view emergency services" ON public.provider_emergency_services;

-- Create policies for provider_emergency_services
CREATE POLICY "Providers can view their own emergency services"
ON public.provider_emergency_services FOR SELECT
USING (auth.uid() = provider_id);

CREATE POLICY "Providers can insert their own emergency services"
ON public.provider_emergency_services FOR INSERT
WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update their own emergency services"
ON public.provider_emergency_services FOR UPDATE
USING (auth.uid() = provider_id);

CREATE POLICY "Providers can delete their own emergency services"
ON public.provider_emergency_services FOR DELETE
USING (auth.uid() = provider_id);

CREATE POLICY "Public can view emergency services"
ON public.provider_emergency_services FOR SELECT
USING (accepts_emergency = true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_provider_emergency_services_provider_id 
ON public.provider_emergency_services(provider_id);

CREATE INDEX IF NOT EXISTS idx_provider_emergency_services_category_id 
ON public.provider_emergency_services(category_id);

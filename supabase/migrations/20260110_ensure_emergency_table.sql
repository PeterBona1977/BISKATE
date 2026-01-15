-- Ensure provider_emergency_services table exists
-- EXECUTAR NO SUPABASE SQL EDITOR

BEGIN;

CREATE TABLE IF NOT EXISTS public.provider_emergency_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  accepts_emergency BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(provider_id, category_id)
);

-- Enable RLS
ALTER TABLE public.provider_emergency_services ENABLE ROW LEVEL SECURITY;

-- Re-create policies to be sure
DROP POLICY IF EXISTS "Providers can view their own emergency services" ON public.provider_emergency_services;
CREATE POLICY "Providers can view their own emergency services"
ON public.provider_emergency_services FOR SELECT
USING (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Providers can insert their own emergency services" ON public.provider_emergency_services;
CREATE POLICY "Providers can insert their own emergency services"
ON public.provider_emergency_services FOR INSERT
WITH CHECK (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Providers can update their own emergency services" ON public.provider_emergency_services;
CREATE POLICY "Providers can update their own emergency services"
ON public.provider_emergency_services FOR UPDATE
USING (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Providers can delete their own emergency services" ON public.provider_emergency_services;
CREATE POLICY "Providers can delete their own emergency services"
ON public.provider_emergency_services FOR DELETE
USING (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Public can view emergency services" ON public.provider_emergency_services;
CREATE POLICY "Public can view emergency services"
ON public.provider_emergency_services FOR SELECT
USING (accepts_emergency = true);

COMMIT;

-- =====================================================
-- GIGHUB - EMERGENCY SERVICE SCHEMA
-- =====================================================

-- 1. ADD NEW COLUMNS TO PROFILES FOR REAL-TIME TRACKING
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_lat DOUBLE PRECISION;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_lng DOUBLE PRECISION;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_status TEXT DEFAULT 'available'; -- 'available', 'on_call', 'busy'

-- 2. CREATE EMERGENCY REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.emergency_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'in_progress', 'completed', 'cancelled'
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT,
  price_multiplier DECIMAL DEFAULT 1.5, -- Emergency premium
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 3. ENABLE RLS
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES
-- Clients can see their own requests
CREATE POLICY "emergency_requests_client_select" ON public.emergency_requests 
  FOR SELECT USING (client_id = auth.uid());

-- Providers can see requests assigned to them
CREATE POLICY "emergency_requests_provider_select" ON public.emergency_requests 
  FOR SELECT USING (provider_id = auth.uid());

-- Online providers with 'emergency_calls' feature can see pending requests (Handled by service broadcasting, but allow select for nearby logic)
CREATE POLICY "emergency_requests_online_providers_select" ON public.emergency_requests 
  FOR SELECT USING (
    status = 'pending' AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_online = TRUE AND role = 'provider'
    )
  );

-- Clients can create emergency requests
CREATE POLICY "emergency_requests_insert" ON public.emergency_requests 
  FOR INSERT WITH CHECK (client_id = auth.uid());

-- 5. UPDATE PLAN LIMITS TO INCLUDE EMERGENCY FEATURE
-- Update 'pro' and 'unlimited' plans to have emergency_calls = true
UPDATE public.plan_limits 
SET features = features || '{"emergency_calls": true}'::jsonb
WHERE plan_tier IN ('pro', 'unlimited');

-- Ensure 'free' and 'essential' have it false
UPDATE public.plan_limits 
SET features = features || '{"emergency_calls": false}'::jsonb
WHERE plan_tier IN ('free', 'essential');

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_emergency_requests_client_id ON public.emergency_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_provider_id ON public.emergency_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_status ON public.emergency_requests(status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON public.profiles(is_online) WHERE is_online = TRUE;

-- Migration: Fix Emergency RLS and permissions
-- Purpose: Allow clients to cancel requests and providers to view/update them correctly

BEGIN;

-- 1. ADD UPDATE POLICY FOR CLIENTS (Cancellation)
DROP POLICY IF EXISTS "emergency_requests_client_update" ON public.emergency_requests;
CREATE POLICY "emergency_requests_client_update" ON public.emergency_requests
  FOR UPDATE USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- 2. ADD UPDATE POLICY FOR ASSIGNED PROVIDERS
DROP POLICY IF EXISTS "emergency_requests_provider_update" ON public.emergency_requests;
CREATE POLICY "emergency_requests_provider_update" ON public.emergency_requests
  FOR UPDATE USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

-- 3. FIX PROVIDER SELECT POLICY (Include is_provider check)
DROP POLICY IF EXISTS "emergency_requests_online_providers_select" ON public.emergency_requests;
CREATE POLICY "emergency_requests_online_providers_select" ON public.emergency_requests 
  FOR SELECT USING (
    status = 'pending' AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND is_online = TRUE 
      AND (role = 'provider' OR is_provider = TRUE)
    )
  );

-- 4. ENSURE PROVIDER CAN SEE ASSIGNED REQUESTS REGARDLESS OF ROLE
DROP POLICY IF EXISTS "emergency_requests_provider_select" ON public.emergency_requests;
CREATE POLICY "emergency_requests_provider_select" ON public.emergency_requests 
  FOR SELECT USING (provider_id = auth.uid());

-- 5. ENSURE RESPONSES ARE VISIBLE TO PROVIDERS
-- This was mostly correct but let's be sure
DROP POLICY IF EXISTS "emergency_responses_provider_insert" ON public.emergency_responses;
CREATE POLICY "emergency_responses_provider_insert" ON public.emergency_responses
  FOR INSERT WITH CHECK (provider_id = auth.uid());

COMMIT;

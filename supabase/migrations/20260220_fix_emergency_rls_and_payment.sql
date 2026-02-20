-- Migration: Secure and Enable Response Visibility (Fixed)
-- Purpose: Fix RLS to allow clients to see proposals and implement payment logic

-- 1. FIX RLS FOR EMERGENCY RESPONSES
-- Drop existing policies to avoid name collisions if re-running
DROP POLICY IF EXISTS "emergency_responses_client_select" ON public.emergency_responses;
DROP POLICY IF EXISTS "emergency_responses_provider_select" ON public.emergency_responses;

-- Clients need to see responses to THEIR emergency requests.
CREATE POLICY "emergency_responses_client_select" ON public.emergency_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.emergency_requests
      WHERE emergency_requests.id = emergency_responses.emergency_id
      AND emergency_requests.client_id = auth.uid()
    )
  );

-- Providers need to see their own responses
CREATE POLICY "emergency_responses_provider_select" ON public.emergency_responses
  FOR SELECT
  USING (provider_id = auth.uid());

-- 2. ENSURE RLS IS ENABLED
ALTER TABLE public.emergency_responses ENABLE ROW LEVEL SECURITY;

-- 3. ENSURE REALTIME REPLICATION
-- Check if table is already in publication to avoid error 42710
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'emergency_responses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_responses;
  END IF;
END $$;

-- 4. ADD PAYMENT TRACKING COLUMNS
ALTER TABLE public.emergency_requests 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending_payment'; -- 'pending_payment', 'paid', 'refunded'

ALTER TABLE public.emergency_requests 
ADD COLUMN IF NOT EXISTS payment_id TEXT; -- Stripe/External ID

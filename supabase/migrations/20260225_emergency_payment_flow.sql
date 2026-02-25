-- Migration: Redesign emergency payment flow
-- Date: 2026-02-25

-- 1. Add payment tracking columns to emergency_requests
ALTER TABLE public.emergency_requests
  ADD COLUMN IF NOT EXISTS travel_fee         NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS travel_fee_status  TEXT DEFAULT 'none',
  -- values: none | held | charged | refunded
  ADD COLUMN IF NOT EXISTS service_fee        NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS service_fee_status TEXT DEFAULT 'none',
  -- values: none | held | charged | refunded | disputed
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_by        TEXT,
  -- values: client | provider
  ADD COLUMN IF NOT EXISTS dispute_reason      TEXT;

-- 2. Create emergency_assessments table (provider evaluates on-site)
CREATE TABLE IF NOT EXISTS public.emergency_assessments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id          UUID REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
  provider_id           UUID REFERENCES public.profiles(id),
  description           TEXT NOT NULL,
  final_price           NUMERIC(10,2) NOT NULL,
  photos                TEXT[] DEFAULT '{}',
  status                TEXT DEFAULT 'pending',
  -- values: pending | accepted | declined | completed | failed | disputed
  client_response       TEXT,
  client_decline_reason TEXT,
  provider_failure_reason TEXT,
  provider_agrees_refund  BOOLEAN,
  dispute_reason        TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS for emergency_assessments
ALTER TABLE public.emergency_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assess_select_participants" ON public.emergency_assessments;
CREATE POLICY "assess_select_participants" ON public.emergency_assessments
  FOR SELECT USING (
    provider_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.emergency_requests r
      WHERE r.id = emergency_assessments.emergency_id
      AND r.client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "assess_insert_provider" ON public.emergency_assessments;
CREATE POLICY "assess_insert_provider" ON public.emergency_assessments
  FOR INSERT TO authenticated
  WITH CHECK (provider_id = auth.uid());

DROP POLICY IF EXISTS "assess_update_participants" ON public.emergency_assessments;
CREATE POLICY "assess_update_participants" ON public.emergency_assessments
  FOR UPDATE USING (
    provider_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.emergency_requests r
      WHERE r.id = emergency_assessments.emergency_id
      AND r.client_id = auth.uid()
    )
  );

-- 4. Add conversations SELECT policy for participants
DROP POLICY IF EXISTS "conv_select_participants" ON public.conversations;
CREATE POLICY "conv_select_participants" ON public.conversations
  FOR SELECT USING (
    client_id = auth.uid() OR provider_id = auth.uid()
  );

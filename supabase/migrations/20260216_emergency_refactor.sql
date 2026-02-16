
-- Migration: Emergency Management Refactor
-- Purpose: Add missing timestamp columns and cleanup active emergencies

-- 1. Add missing tracking columns to emergency_requests
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='emergency_requests' AND column_name='accepted_at') THEN
        ALTER TABLE public.emergency_requests ADD COLUMN accepted_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='emergency_requests' AND column_name='completed_at') THEN
        ALTER TABLE public.emergency_requests ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Cleanup all active emergencies as requested
-- This removes records with status: pending, accepted, in_progress
DELETE FROM public.emergency_requests 
WHERE status IN ('pending', 'accepted', 'in_progress');

-- 3. (Optional) Cleanup notifications related to these requests if they clutter the system
-- DELETE FROM public.notifications WHERE data->>'requestId' IN (SELECT id FROM deleted_ids); 
-- Note: CASCADE usually handles record-level dependencies if FKs are set.

COMMENT ON COLUMN public.emergency_requests.accepted_at IS 'Timestamp when the provider was accepted by the client';
COMMENT ON COLUMN public.emergency_requests.completed_at IS 'Timestamp when the service was marked as completed';

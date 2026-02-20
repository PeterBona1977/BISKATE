-- Migration: Add emergency_id to conversations
-- Purpose: Allow conversations to be linked to emergency requests

ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS emergency_id UUID REFERENCES public.emergency_requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_emergency_id ON public.conversations(emergency_id);

-- Ensure RLS allows access if you are a participant (existing policies should cover this, 
-- but we rely on conversation_participants which we will populate)

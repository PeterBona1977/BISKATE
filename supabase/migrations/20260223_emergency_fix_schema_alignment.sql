-- =====================================================
-- GIGHUB - EMERGENCY CHAT AND STATUS CONVENIENCE
-- =====================================================

-- 1. Ensure 'client_id' and 'provider_id' columns exist in public.conversations
-- These allow easier correlation for emergency chats without heavy joins
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='client_id') THEN
        ALTER TABLE public.conversations ADD COLUMN client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='provider_id') THEN
        ALTER TABLE public.conversations ADD COLUMN provider_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Create index for faster lookup of emergency conversations
CREATE INDEX IF NOT EXISTS idx_conversations_provider_id ON public.conversations(provider_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON public.conversations(client_id);

-- 3. Update 'arrived' check constraint for emergency requests
-- We add 'arrived' to the allowed statuses
ALTER TABLE public.emergency_requests DROP CONSTRAINT IF EXISTS emergency_requests_status_check;
ALTER TABLE public.emergency_requests ADD CONSTRAINT emergency_requests_status_check 
    CHECK (status IN ('pending', 'accepted', 'in_progress', 'arrived', 'completed', 'cancelled'));

-- 4. Enable Realtime for the conversation table
-- This ensures chat notifications and live updates work as expected
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
END $$;

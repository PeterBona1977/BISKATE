-- Fix: Messages table Realtime and RLS for emergency chat
-- 1a. Ensure messages table is in the Supabase Realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
END $$;

-- 1b. Ensure conversations table is in the Supabase Realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    END IF;
END $$;

-- 2. Fix SELECT RLS on messages so participants can read their conversation messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can read messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can read messages" ON public.messages;
DROP POLICY IF EXISTS "msg_select_participants" ON public.messages;

-- Allow reading messages if the user is involved in the conversation
CREATE POLICY "msg_select_participants" ON public.messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
            AND (c.client_id = auth.uid() OR c.provider_id = auth.uid())
        )
        OR
        sender_id = auth.uid()
    );

-- 3. INSERT: allow authenticated users to insert their own messages
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.messages;
DROP POLICY IF EXISTS "msg_insert_own" ON public.messages;

CREATE POLICY "msg_insert_own" ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (sender_id = auth.uid());

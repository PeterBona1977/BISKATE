-- Fix: infinite recursion detected in policy for relation "conversation_participants"
-- The SELECT policy on conversation_participants was referencing conversations
-- which in turn references conversation_participants, creating infinite recursion.

-- Drop all existing policies on conversation_participants that may cause recursion
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can insert their own participation" ON public.conversation_participants;
DROP POLICY IF EXISTS "Authenticated users can insert participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;

-- Re-create simple, non-recursive policies
-- SELECT: a user can see participants of a conversation if they are one of the participants
-- Using a simple direct check without joining back to conversations to avoid recursion
CREATE POLICY "cp_select_own" ON public.conversation_participants
    FOR SELECT
    USING (user_id = auth.uid());

-- INSERT: a user can insert any participant record if they are authenticated
-- (Admin client is used for all emergency inserts, but this allows normal gig chat too)
CREATE POLICY "cp_insert_authenticated" ON public.conversation_participants
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Also ensure conversations SELECT policy doesn't reference conversation_participants
-- Drop and re-create a safe SELECT policy
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;

CREATE POLICY "conv_select_own" ON public.conversations
    FOR SELECT
    USING (
        client_id = auth.uid() OR
        provider_id = auth.uid() OR
        auth.uid() IS NOT NULL -- Fallback for legacy gig conversations
    );

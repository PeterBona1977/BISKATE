-- Migration to resolve Supabase Advisor security warnings
-- Version 2: More robust using DO blocks to handle missing functions

-- 1. Fix function_search_path_mutable for all reported functions
-- We update each function to include SET search_path = public safely

DO $$ 
BEGIN
    -- handle_new_user
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'handle_new_user') THEN
        ALTER FUNCTION public.handle_new_user() SET search_path = public;
    END IF;

    -- is_admin (handling potential signature differences)
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'is_admin') THEN
        -- We try to alter it without signature if unique, or provide signature
        BEGIN
            ALTER FUNCTION public.is_admin(uuid) SET search_path = public;
        EXCEPTION WHEN OTHERS THEN
            BEGIN
                ALTER FUNCTION public.is_admin() SET search_path = public;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not alter is_admin - please check signature';
            END;
        END;
    END IF;

    -- mark_messages_as_read
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'mark_messages_as_read') THEN
        ALTER FUNCTION public.mark_messages_as_read(uuid, uuid) SET search_path = public;
    END IF;

    -- sync_gig_authors
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'sync_gig_authors') THEN
        ALTER FUNCTION public.sync_gig_authors() SET search_path = public;
    END IF;

    -- clean_expired_device_tokens
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'clean_expired_device_tokens') THEN
        ALTER FUNCTION public.clean_expired_device_tokens() SET search_path = public;
    END IF;

    -- create_default_notification_preferences
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'create_default_notification_preferences') THEN
        ALTER FUNCTION public.create_default_notification_preferences() SET search_path = public;
    END IF;

    -- get_user_quotas
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_user_quotas') THEN
        ALTER FUNCTION public.get_user_quotas(uuid) SET search_path = public;
    END IF;

    -- reset_user_quotas
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'reset_user_quotas') THEN
        ALTER FUNCTION public.reset_user_quotas() SET search_path = public;
    END IF;
END $$;


-- 2. Fix rls_policy_always_true for conversations and conversation_participants

-- For conversations: 
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' AND column_name = 'participant1_id'
    ) THEN
        CREATE POLICY "Users can create conversations" ON public.conversations 
        FOR INSERT WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);
    ELSE
        CREATE POLICY "Users can create conversations" ON public.conversations 
        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
END $$;


-- For conversation_participants:
DROP POLICY IF EXISTS "Authenticated users can insert participants" ON public.conversation_participants;
CREATE POLICY "Authenticated users can insert participants" ON public.conversation_participants 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

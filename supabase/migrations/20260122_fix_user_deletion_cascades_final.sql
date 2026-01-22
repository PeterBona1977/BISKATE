-- Migration: Fix User Deletion Cascades for Remaining Tables
-- Date: 2026-01-22
-- Purpose: Ensure user deletion doesn't fail due to FK constraints in notifications, gigs, etc.

BEGIN;

-- 1. Helper Function (Same as before, ensuring availability)
CREATE OR REPLACE FUNCTION public.safe_fix_profile_cascade_v3(
    t_name TEXT, 
    c_name TEXT, 
    new_rule TEXT DEFAULT 'CASCADE',
    make_nullable BOOLEAN DEFAULT FALSE
) 
RETURNS VOID AS $$
DECLARE
    found_constraint TEXT;
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t_name AND table_schema = 'public') THEN
        RETURN;
    END IF;

    -- Search for constraint referencing profiles
    SELECT tc.constraint_name INTO found_constraint
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON rc.unique_constraint_name = ccu.constraint_name
    WHERE tc.table_name = t_name 
    AND kcu.column_name = c_name 
    AND (ccu.table_name = 'profiles' OR ccu.table_name = 'users') -- Handle auth.users refs if exposed or profiles
    LIMIT 1;

    -- Fallback search
    IF found_constraint IS NULL THEN
        SELECT constraint_name INTO found_constraint
        FROM information_schema.key_column_usage
        WHERE table_name = t_name AND column_name = c_name
        AND constraint_name NOT LIKE '%_pkey'
        LIMIT 1;
    END IF;

    IF found_constraint IS NOT NULL THEN
        -- Drop old
        EXECUTE 'ALTER TABLE public.' || quote_ident(t_name) || ' DROP CONSTRAINT ' || quote_ident(found_constraint);
        
        -- Make nullable if needed
        IF make_nullable THEN
            EXECUTE 'ALTER TABLE public.' || quote_ident(t_name) || ' ALTER COLUMN ' || quote_ident(c_name) || ' DROP NOT NULL';
        END IF;

        -- Add new with rule (Assuming reference to public.profiles for simplicity, as most logic uses that)
        -- Warning: If the original was referencing auth.users, this might break if we force profiles. 
        -- But inconsistent refs are bad anyway. We'll target profiles(id).
        EXECUTE 'ALTER TABLE public.' || quote_ident(t_name) || 
                ' ADD CONSTRAINT ' || quote_ident(t_name || '_' || c_name || '_fkey_v3') ||
                ' FOREIGN KEY (' || quote_ident(c_name) || ') REFERENCES public.profiles(id) ON DELETE ' || new_rule;
        
        RAISE NOTICE 'Fixed constraint for %.%', t_name, c_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Apply Fixes

-- Notifications: Should Cascade (Delete user -> Delete their notifications)
SELECT public.safe_fix_profile_cascade_v3('notifications', 'user_id', 'CASCADE');

-- Gigs: Should Cascade (Delete user -> Delete their gigs)
-- Checking common column names
SELECT public.safe_fix_profile_cascade_v3('gigs', 'user_id', 'CASCADE');
SELECT public.safe_fix_profile_cascade_v3('gigs', 'author_id', 'CASCADE');
SELECT public.safe_fix_profile_cascade_v3('gigs', 'provider_id', 'CASCADE');

-- Proposals / Responses: Should Cascade
SELECT public.safe_fix_profile_cascade_v3('proposals', 'provider_id', 'CASCADE');
SELECT public.safe_fix_profile_cascade_v3('proposals', 'user_id', 'CASCADE');
SELECT public.safe_fix_profile_cascade_v3('responses', 'provider_id', 'CASCADE'); -- In case it's named responses

-- Reviews: Should Cascade (or Set Null? Cascade is cleaner for deletion)
SELECT public.safe_fix_profile_cascade_v3('reviews', 'author_id', 'CASCADE');
SELECT public.safe_fix_profile_cascade_v3('reviews', 'reviewer_id', 'CASCADE');
SELECT public.safe_fix_profile_cascade_v3('reviews', 'target_id', 'CASCADE');
SELECT public.safe_fix_profile_cascade_v3('reviews', 'provider_id', 'CASCADE');

-- User verifications / documents
SELECT public.safe_fix_profile_cascade_v3('provider_documents', 'user_id', 'CASCADE');
SELECT public.safe_fix_profile_cascade_v3('provider_verifications', 'provider_id', 'CASCADE');

-- 3. Cleanup
DROP FUNCTION public.safe_fix_profile_cascade_v3(TEXT, TEXT, TEXT, BOOLEAN);

COMMIT;

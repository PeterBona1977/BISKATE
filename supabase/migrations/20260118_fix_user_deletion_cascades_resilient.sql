-- Migration: Universal User Deletion Cascade Fix (V2 - Resilient & Conflict-Aware)
-- Date: 2026-01-18
-- Author: Antigravity

-- This migration ensures that deleting a user from the profiles table 
-- does not fail due to foreign key constraints. 
-- It is designed to be RESILIENT: it checks if tables exist before modifying them.

BEGIN;

-- 1. Helper Function to safely update a foreign key
CREATE OR REPLACE FUNCTION public.safe_fix_profile_cascade(
    t_name TEXT, 
    c_name TEXT, 
    new_rule TEXT DEFAULT 'CASCADE',
    make_nullable BOOLEAN DEFAULT FALSE
) 
RETURNS VOID AS $$
DECLARE
    found_constraint TEXT;
BEGIN
    -- Check if table exists in public schema
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t_name AND table_schema = 'public') THEN
        RETURN;
    END IF;

    -- Find the constraint name for this column referencing profiles
    SELECT tc.constraint_name INTO found_constraint
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.constraint_schema = kcu.constraint_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
      AND tc.constraint_schema = rc.constraint_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON rc.unique_constraint_name = ccu.constraint_name
      AND rc.unique_constraint_schema = ccu.constraint_schema
    WHERE tc.table_name = t_name 
    AND kcu.column_name = c_name 
    AND tc.table_schema = 'public'
    AND ccu.table_name = 'profiles'
    LIMIT 1;

    -- Also check for constraints without schema prefix in the search (fallback)
    IF found_constraint IS NULL THEN
        SELECT constraint_name INTO found_constraint
        FROM information_schema.key_column_usage
        WHERE table_name = t_name AND column_name = c_name
        AND constraint_name NOT LIKE '%_pkey'
        LIMIT 1;
    END IF;

    IF found_constraint IS NOT NULL THEN
        -- Drop old constraint
        EXECUTE 'ALTER TABLE public.' || quote_ident(t_name) || ' DROP CONSTRAINT ' || quote_ident(found_constraint);
        
        -- Drop NOT NULL if requested (necessary for SET NULL to work)
        IF make_nullable THEN
            EXECUTE 'ALTER TABLE public.' || quote_ident(t_name) || ' ALTER COLUMN ' || quote_ident(c_name) || ' DROP NOT NULL';
        END IF;

        -- Add new constraint
        EXECUTE 'ALTER TABLE public.' || quote_ident(t_name) || 
                ' ADD CONSTRAINT ' || quote_ident(t_name || '_' || c_name || '_fkey') ||
                ' FOREIGN KEY (' || quote_ident(c_name) || ') REFERENCES public.profiles(id) ON DELETE ' || new_rule;
        
        RAISE NOTICE 'Fixed constraint for %.%', t_name, c_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Apply fixes to ALL potential blockers
-- CASCADE for high-dependency tables
SELECT public.safe_fix_profile_cascade('job_completions', 'provider_id', 'CASCADE');
SELECT public.safe_fix_profile_cascade('contact_views', 'viewer_id', 'CASCADE');
SELECT public.safe_fix_profile_cascade('contact_views', 'gig_author_id', 'CASCADE');

-- SET NULL for logging/content tables
SELECT public.safe_fix_profile_cascade('cms_pages', 'author_id', 'SET NULL', TRUE);
SELECT public.safe_fix_profile_cascade('cms_pages', 'created_by', 'SET NULL', TRUE);
SELECT public.safe_fix_profile_cascade('cms_pages', 'updated_by', 'SET NULL', TRUE);
SELECT public.safe_fix_profile_cascade('cms_page_versions', 'created_by', 'SET NULL', TRUE);
SELECT public.safe_fix_profile_cascade('cms_menus', 'created_by', 'SET NULL', TRUE);
SELECT public.safe_fix_profile_cascade('cms_media', 'uploaded_by', 'SET NULL', TRUE);
SELECT public.safe_fix_profile_cascade('platform_config', 'updated_by', 'SET NULL', TRUE);
SELECT public.safe_fix_profile_cascade('moderation_actions', 'moderator_id', 'SET NULL', TRUE);
SELECT public.safe_fix_profile_cascade('moderation_alerts', 'resolved_by', 'SET NULL', TRUE);

-- 3. Cleanup
DROP FUNCTION public.safe_fix_profile_cascade(TEXT, TEXT, TEXT, BOOLEAN);

COMMIT;

SELECT 'Universal User Deletion Fix V2 applied successfully.' as result;

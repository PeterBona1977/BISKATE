-- BISKATE: Fix RLS Recursion Issues - Final Script
-- This script removes all problematic RLS policies and creates simple ones

-- Start transaction
BEGIN;

-- Disable RLS temporarily on all tables to avoid recursion
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gigs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_preferences DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DO $$
DECLARE
    pol RECORD;
    tbl TEXT;
BEGIN
    -- List of tables to clean
    FOR tbl IN SELECT unnest(ARRAY['profiles', 'gigs', 'responses', 'notifications', 'user_preferences'])
    LOOP
        -- Drop all policies for this table
        FOR pol IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = tbl
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, tbl);
            RAISE NOTICE 'Dropped policy % on table %', pol.policyname, tbl;
        END LOOP;
    END LOOP;
END $$;

-- Re-enable RLS on tables
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_preferences ENABLE ROW LEVEL SECURITY;

-- Create SIMPLE policies for profiles (no recursion)
CREATE POLICY "profiles_select_all" ON profiles 
    FOR SELECT 
    USING (true);

CREATE POLICY "profiles_insert_own" ON profiles 
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles 
    FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON profiles 
    FOR DELETE 
    USING (auth.uid() = id);

-- Create SIMPLE policies for gigs
CREATE POLICY "gigs_select_all" ON gigs 
    FOR SELECT 
    USING (true);

CREATE POLICY "gigs_insert_own" ON gigs 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "gigs_update_own" ON gigs 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "gigs_delete_own" ON gigs 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Create SIMPLE policies for responses
CREATE POLICY "responses_select_all" ON responses 
    FOR SELECT 
    USING (true);

CREATE POLICY "responses_insert_own" ON responses 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "responses_update_own" ON responses 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Create SIMPLE policies for notifications
CREATE POLICY "notifications_select_own" ON notifications 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_own" ON notifications 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON notifications 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Create SIMPLE policies for user_preferences
CREATE POLICY "user_preferences_select_own" ON user_preferences 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "user_preferences_insert_own" ON user_preferences 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_preferences_update_own" ON user_preferences 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Create helper functions for RLS diagnostics
CREATE OR REPLACE FUNCTION check_rls_status(table_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = table_name
        AND n.nspname = 'public'
        AND c.relrowsecurity = true
    );
END;
$$;

-- Create function to get system stats without recursion
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', COALESCE((SELECT COUNT(*) FROM auth.users), 0),
        'total_profiles', COALESCE((SELECT COUNT(*) FROM profiles), 0),
        'total_gigs', COALESCE((SELECT COUNT(*) FROM gigs), 0),
        'total_responses', COALESCE((SELECT COUNT(*) FROM responses), 0),
        'total_notifications', COALESCE((SELECT COUNT(*) FROM notifications), 0),
        'rls_enabled', check_rls_status('profiles')
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_rls_status(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_stats() TO authenticated;

-- Commit transaction
COMMIT;

-- Log completion
SELECT 'RLS recursion fix completed successfully' as status;

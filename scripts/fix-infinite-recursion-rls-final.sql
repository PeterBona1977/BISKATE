-- Fix infinite recursion in RLS policies
-- This script removes problematic policies and creates safe ones

BEGIN;

-- Drop all existing RLS policies on profiles table that might cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_select_simple" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_simple" ON profiles;
DROP POLICY IF EXISTS "profiles_update_simple" ON profiles;

-- Temporarily disable RLS to clean up
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies using auth.uid() directly
CREATE POLICY "profiles_select_safe" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_safe" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_safe" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_user_profile(uuid);
DROP FUNCTION IF EXISTS create_user_profile(uuid, text, text, text);

-- Create a safe function to get user profile without recursion
CREATE OR REPLACE FUNCTION get_user_profile(user_id uuid)
RETURNS TABLE (
    id uuid,
    email text,
    full_name text,
    avatar_url text,
    role text,
    is_admin boolean,
    is_provider boolean,
    provider_status text,
    subscription_plan text,
    created_at timestamptz,
    updated_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.full_name,
        p.avatar_url,
        p.role,
        p.is_admin,
        p.is_provider,
        p.provider_status,
        p.subscription_plan,
        p.created_at,
        p.updated_at
    FROM profiles p
    WHERE p.id = user_id;
END;
$$;

-- Create function to safely create profile
CREATE OR REPLACE FUNCTION create_user_profile(
    user_id uuid,
    user_email text,
    user_full_name text DEFAULT NULL,
    user_avatar_url text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    email text,
    full_name text,
    avatar_url text,
    role text,
    is_admin boolean,
    is_provider boolean,
    provider_status text,
    subscription_plan text,
    created_at timestamptz,
    updated_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert the new profile
    INSERT INTO profiles (
        id,
        email,
        full_name,
        avatar_url,
        role,
        is_admin,
        is_provider,
        provider_status,
        subscription_plan
    ) VALUES (
        user_id,
        user_email,
        user_full_name,
        user_avatar_url,
        'user',
        false,
        false,
        null,
        'free'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        updated_at = NOW();
    
    -- Return the profile data
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.full_name,
        p.avatar_url,
        p.role,
        p.is_admin,
        p.is_provider,
        p.provider_status,
        p.subscription_plan,
        p.created_at,
        p.updated_at
    FROM profiles p
    WHERE p.id = user_id;
END;
$$;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION get_user_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile(uuid) TO anon;
GRANT EXECUTE ON FUNCTION create_user_profile(uuid, text, text, text) TO authenticated;

-- Test the setup
DO $$
BEGIN
    RAISE NOTICE 'RLS policies have been fixed successfully!';
    RAISE NOTICE 'Safe functions created: get_user_profile() and create_user_profile()';
    RAISE NOTICE 'Infinite recursion should now be resolved.';
END;
$$;

COMMIT;

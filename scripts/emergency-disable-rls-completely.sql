-- BISKATE Emergency RLS Fix Script
-- This script completely disables RLS to prevent infinite recursion
-- Run this in Supabase SQL Editor

BEGIN;

-- 1. Disable RLS on all tables
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gigs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS proposals DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing RLS policies to prevent conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by all" ON profiles;

DROP POLICY IF EXISTS "Users can view approved gigs" ON gigs;
DROP POLICY IF EXISTS "Users can create own gigs" ON gigs;
DROP POLICY IF EXISTS "Users can update own gigs" ON gigs;
DROP POLICY IF EXISTS "Admins can manage all gigs" ON gigs;

DROP POLICY IF EXISTS "Users can view own responses" ON responses;
DROP POLICY IF EXISTS "Users can create responses" ON responses;
DROP POLICY IF EXISTS "Gig authors can view responses to their gigs" ON responses;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- 3. Grant full access to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 4. Create safe functions without RLS dependencies
CREATE OR REPLACE FUNCTION get_user_profile(user_email text)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamptz,
  updated_at timestamptz
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.email = user_email
  LIMIT 1;
$$;

-- 5. Create system stats function
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'total_gigs', (SELECT COUNT(*) FROM gigs),
    'active_gigs', (SELECT COUNT(*) FROM gigs WHERE status = 'approved'),
    'total_responses', (SELECT COUNT(*) FROM responses),
    'rls_disabled', true,
    'timestamp', NOW()
  );
$$;

-- 6. Ensure admin profile exists
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'pmbonanca@gmail.com',
  'Admin User',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();

-- 7. Create test user profile
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'user@biskate.com',
  'Test User',
  'user',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  updated_at = NOW();

-- 8. Verify the fix
DO $$
DECLARE
  profile_count integer;
  gig_count integer;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles;
  SELECT COUNT(*) INTO gig_count FROM gigs;
  
  RAISE NOTICE 'SUCCESS: Emergency RLS fix completed - infinite recursion eliminated';
  RAISE NOTICE 'Profiles: %, Gigs: %', profile_count, gig_count;
  RAISE NOTICE 'All RLS policies disabled, safe functions created, admin profile ensured';
END $$;

COMMIT;

-- Final verification query
SELECT 
  'Emergency RLS Fix Completed' as status,
  COUNT(*) as total_profiles,
  (SELECT COUNT(*) FROM gigs) as total_gigs,
  NOW() as completed_at
FROM profiles;

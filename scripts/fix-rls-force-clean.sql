-- FORCE CLEAN RLS Script
-- This script dynamically finds and attempts to drop ALL policies on the 'profiles' table.
-- It avoids guessing policy names by querying the system catalog.

BEGIN;

-- 1. Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Dynamic removal of all policies on 'profiles'
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', r.policyname);
    END LOOP;
END $$;

-- 3. Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create SIMPLE, SAFE policies (idempotent checks not needed as we dropped everything)

-- Select: Allow anyone to view any profile
CREATE POLICY "profiles_select_fixed" ON profiles
    FOR SELECT USING (true);

-- Insert: Users can insert their own profile
CREATE POLICY "profiles_insert_fixed" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Update: Users can update their own profile
CREATE POLICY "profiles_update_fixed" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 5. Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

COMMIT;

SELECT 'Force clean RLS fix applied successfully' as result;

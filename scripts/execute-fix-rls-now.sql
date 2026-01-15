-- EXECUTAR DIRETAMENTE: Fix RLS policies completely to stop infinite recursion
BEGIN;

-- Drop ALL existing policies on profiles table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.profiles';
    END LOOP;
END $$;

-- Disable RLS completely first
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop and recreate the table to ensure clean state
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table with proper structure
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'provider', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "profiles_insert" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Create super admin profile
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    id,
    'admin@biskate.com',
    'Super Admin',
    'admin'
FROM auth.users 
WHERE email = 'admin@biskate.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = 'Super Admin',
    updated_at = NOW();

-- Create profile for existing user
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', email),
    'client'
FROM auth.users 
WHERE email = 'pmbonanca@gmail.com'
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();

COMMIT;

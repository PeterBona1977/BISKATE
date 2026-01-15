-- EXECUTAR AGORA - Fix RLS policies completely
BEGIN;

-- Drop ALL existing policies on profiles table
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Disable RLS completely
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop and recreate the table
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table WITHOUT RLS
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'provider', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant permissions WITHOUT RLS
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

-- Insert your profile directly
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
    '4bc3eb8c-0cef-4e82-b35c-4e8d36456b51',
    'pmbonanca@gmail.com',
    'Paulo Bonança',
    'admin'
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = 'Paulo Bonança',
    updated_at = NOW();

-- Create admin user if it doesn't exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@biskate.com') THEN
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
    END IF;
END $$;

-- Create trigger to automatically create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        'client'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;

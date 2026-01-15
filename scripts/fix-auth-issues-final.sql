-- Fix authentication and profile issues
-- Run this to ensure your existing user can login

-- 1. Check if profiles table exists and has correct structure
DO $$ 
BEGIN
    -- Ensure profiles table has all required columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
        ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_provider') THEN
        ALTER TABLE profiles ADD COLUMN is_provider BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'provider_status') THEN
        ALTER TABLE profiles ADD COLUMN provider_status TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_plan') THEN
        ALTER TABLE profiles ADD COLUMN subscription_plan TEXT DEFAULT 'free';
    END IF;
END $$;

-- 2. Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;

-- 4. Create simple, working RLS policies
CREATE POLICY "Enable read access for own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 5. Create or replace function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, is_admin, is_provider, subscription_plan)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'user',
    false,
    false,
    'free'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Fix any existing users without profiles
INSERT INTO public.profiles (id, email, full_name, role, is_admin, is_provider, subscription_plan)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    'user',
    false,
    false,
    'free'
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 8. Update existing profiles to ensure they have all required fields
UPDATE public.profiles 
SET 
    is_admin = COALESCE(is_admin, false),
    is_provider = COALESCE(is_provider, false),
    subscription_plan = COALESCE(subscription_plan, 'free'),
    role = COALESCE(role, 'user')
WHERE is_admin IS NULL OR is_provider IS NULL OR subscription_plan IS NULL OR role IS NULL;

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;

-- 10. Verify the setup
SELECT 'Setup completed successfully. Users in auth.users:' as status, count(*) as user_count FROM auth.users;
SELECT 'Profiles created:' as status, count(*) as profile_count FROM public.profiles;

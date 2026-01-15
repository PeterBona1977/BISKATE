-- Fix provider system to use profiles table correctly
-- This script ensures the provider system works with the existing database structure

-- 1. Ensure profiles table has all necessary columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_provider BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS provider_status TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS provider_bio TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS provider_skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS provider_hourly_rate DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS provider_availability TEXT DEFAULT NULL;

-- 2. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_provider ON profiles(is_provider);
CREATE INDEX IF NOT EXISTS idx_profiles_provider_status ON profiles(provider_status);

-- 3. Update RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        )
    );

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        )
    );

-- 4. Create function to get provider statistics
CREATE OR REPLACE FUNCTION get_provider_stats(provider_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_gigs', COALESCE((SELECT COUNT(*) FROM gigs WHERE user_id = provider_user_id), 0),
        'active_gigs', COALESCE((SELECT COUNT(*) FROM gigs WHERE user_id = provider_user_id AND status = 'active'), 0),
        'total_responses', COALESCE((SELECT COUNT(*) FROM gig_responses WHERE provider_id = provider_user_id), 0),
        'completed_jobs', COALESCE((SELECT COUNT(*) FROM gig_responses WHERE provider_id = provider_user_id AND status = 'completed'), 0),
        'total_earnings', COALESCE((SELECT SUM(budget) FROM gigs WHERE user_id = provider_user_id), 0)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role, is_admin, is_provider, subscription_plan)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        'user',
        FALSE,
        FALSE,
        'free'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Ensure gigs table exists with correct structure
CREATE TABLE IF NOT EXISTS gigs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    budget DECIMAL(10,2),
    status TEXT DEFAULT 'active',
    category TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Ensure gig_responses table exists with correct structure
CREATE TABLE IF NOT EXISTS gig_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT,
    proposed_price DECIMAL(10,2),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create RLS policies for gigs
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all gigs" ON gigs;
DROP POLICY IF EXISTS "Users can create own gigs" ON gigs;
DROP POLICY IF EXISTS "Users can update own gigs" ON gigs;

CREATE POLICY "Users can view all gigs" ON gigs
    FOR SELECT USING (true);

CREATE POLICY "Users can create own gigs" ON gigs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gigs" ON gigs
    FOR UPDATE USING (auth.uid() = user_id);

-- 9. Create RLS policies for gig_responses
ALTER TABLE gig_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view responses to their gigs" ON gig_responses;
DROP POLICY IF EXISTS "Providers can view their responses" ON gig_responses;
DROP POLICY IF EXISTS "Providers can create responses" ON gig_responses;
DROP POLICY IF EXISTS "Providers can update their responses" ON gig_responses;

CREATE POLICY "Users can view responses to their gigs" ON gig_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM gigs 
            WHERE gigs.id = gig_responses.gig_id 
            AND gigs.user_id = auth.uid()
        )
    );

CREATE POLICY "Providers can view their responses" ON gig_responses
    FOR SELECT USING (auth.uid() = provider_id);

CREATE POLICY "Providers can create responses" ON gig_responses
    FOR INSERT WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update their responses" ON gig_responses
    FOR UPDATE USING (auth.uid() = provider_id);

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_provider_stats(UUID) TO authenticated;

-- 11. Insert some test data if tables are empty
DO $$
BEGIN
    -- Only insert if no data exists
    IF NOT EXISTS (SELECT 1 FROM gigs LIMIT 1) THEN
        -- This will be populated by actual users
        NULL;
    END IF;
END $$;

COMMIT;

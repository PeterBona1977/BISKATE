-- Migration to add missing columns to profiles table
DO $$ 
BEGIN 
    -- Add rating column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'rating') THEN
        ALTER TABLE public.profiles ADD COLUMN rating NUMERIC DEFAULT 0;
    END IF;

    -- Add total_reviews column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_reviews') THEN
        ALTER TABLE public.profiles ADD COLUMN total_reviews INTEGER DEFAULT 0;
    END IF;

    -- Add total_earnings column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_earnings') THEN
        ALTER TABLE public.profiles ADD COLUMN total_earnings NUMERIC DEFAULT 0;
    END IF;

    -- Add profile_completion column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'profile_completion') THEN
        ALTER TABLE public.profiles ADD COLUMN profile_completion INTEGER DEFAULT 0;
    END IF;

    -- Add notification_preferences column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notification_preferences') THEN
        ALTER TABLE public.profiles ADD COLUMN notification_preferences JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Add privacy_settings column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'privacy_settings') THEN
        ALTER TABLE public.profiles ADD COLUMN privacy_settings JSONB DEFAULT '{"show_email": false, "show_phone": false, "show_location": true}'::jsonb;
    END IF;
END $$;

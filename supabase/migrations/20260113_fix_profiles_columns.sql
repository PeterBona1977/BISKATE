-- Comprehensive migration to add all missing provider-specific columns to profiles
DO $$ 
BEGIN 
    -- provider_avatar_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'provider_avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN provider_avatar_url TEXT;
    END IF;

    -- provider_full_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'provider_full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN provider_full_name TEXT;
    END IF;

    -- vat_number
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'vat_number') THEN
        ALTER TABLE public.profiles ADD COLUMN vat_number TEXT;
    END IF;

    -- provider_bio
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'provider_bio') THEN
        ALTER TABLE public.profiles ADD COLUMN provider_bio TEXT;
    END IF;

    -- provider_website
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'provider_website') THEN
        ALTER TABLE public.profiles ADD COLUMN provider_website TEXT;
    END IF;

    -- provider_phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'provider_phone') THEN
        ALTER TABLE public.profiles ADD COLUMN provider_phone TEXT;
    END IF;

    -- provider_experience_years
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'provider_experience_years') THEN
        ALTER TABLE public.profiles ADD COLUMN provider_experience_years INTEGER DEFAULT 0;
    END IF;

    -- provider_hourly_rate
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'provider_hourly_rate') THEN
        ALTER TABLE public.profiles ADD COLUMN provider_hourly_rate NUMERIC DEFAULT 0;
    END IF;

    -- provider_availability
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'provider_availability') THEN
        ALTER TABLE public.profiles ADD COLUMN provider_availability TEXT DEFAULT 'available';
    END IF;

    -- provider_location
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'provider_location') THEN
        ALTER TABLE public.profiles ADD COLUMN provider_location TEXT;
    END IF;

END $$;

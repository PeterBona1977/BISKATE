-- Fix Profile Schema - Comprehensive Version
-- Adds ALL potential missing columns to profiles table

BEGIN;

DO $$
BEGIN
    -- 1. Add email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
        RAISE NOTICE 'Added email column';
    END IF;

    -- 2. Add full_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;
    
    -- 3. Add role
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'client';
    END IF;

    -- 4. Add plan
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'plan') THEN
        ALTER TABLE public.profiles ADD COLUMN plan TEXT DEFAULT 'free';
    END IF;

    -- 5. Add responses_used
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'responses_used') THEN
        ALTER TABLE public.profiles ADD COLUMN responses_used INTEGER DEFAULT 0;
    END IF;

    -- 6. Add updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- 7. Add created_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

COMMIT;

SELECT 'Profile schema fixed comprehensive successfully' as result;

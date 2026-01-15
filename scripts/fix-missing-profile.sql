-- Fix missing profile
-- Run this in Supabase SQL Editor

-- Replace the ID below with the one causing errors if different
DO $$
DECLARE
    target_user_id UUID := '80497189-3f49-44c2-a0a1-1639e956711e';
    user_email TEXT := 'admin@biskate.com'; -- Replace with actual email if known, or dummy
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
        INSERT INTO public.profiles (id, email, full_name, role, plan, is_provider, provider_status)
        VALUES (
            target_user_id,
            user_email,
            'Admin User',
            'admin',
            'unlimited',
            true,
            'approved'
        );
        RAISE NOTICE 'Created missing profile for user %', target_user_id;
    ELSE
        RAISE NOTICE 'Profile for user % already exists', target_user_id;
    END IF;
END $$;

SELECT 'Profile check/fix completed' as result;

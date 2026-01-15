-- Create super admin user
BEGIN;

-- Create the admin user in auth.users if not exists
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Try to find existing admin user
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@biskate.com';
    
    -- If not found, create it
    IF admin_user_id IS NULL THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'admin@biskate.com',
            crypt('admin123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO admin_user_id;
    END IF;

    -- Create or update profile
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        created_at,
        updated_at
    ) VALUES (
        admin_user_id,
        'admin@biskate.com',
        'Super Admin',
        'admin',
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        full_name = 'Super Admin',
        updated_at = NOW();

END $$;

COMMIT;

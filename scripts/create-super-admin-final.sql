-- Create super admin user in auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
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
    '{"full_name": "Super Admin BISKATE"}'
) ON CONFLICT (email) DO NOTHING;

-- Create corresponding profile
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
) 
SELECT 
    u.id,
    u.email,
    'Super Admin BISKATE',
    'admin',
    NOW(),
    NOW()
FROM auth.users u 
WHERE u.email = 'admin@biskate.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = 'Super Admin BISKATE',
    updated_at = NOW();

-- Verify creation
SELECT 
    u.email,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    p.full_name,
    p.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@biskate.com';

-- Create test users for login
-- First, let's make sure we have the auth schema and users table

-- Create admin user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@biskate.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Create client user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'cliente@biskate.com',
  crypt('cliente123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Create provider user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'prestador@biskate.com',
  crypt('prestador123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Create corresponding profiles
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  is_admin,
  is_provider,
  created_at,
  updated_at
) 
SELECT 
  u.id,
  u.email,
  CASE 
    WHEN u.email = 'admin@biskate.com' THEN 'Administrador'
    WHEN u.email = 'cliente@biskate.com' THEN 'Cliente Teste'
    WHEN u.email = 'prestador@biskate.com' THEN 'Prestador Teste'
  END,
  CASE 
    WHEN u.email = 'admin@biskate.com' THEN 'admin'
    WHEN u.email = 'cliente@biskate.com' THEN 'client'
    WHEN u.email = 'prestador@biskate.com' THEN 'provider'
  END,
  CASE WHEN u.email = 'admin@biskate.com' THEN true ELSE false END,
  CASE WHEN u.email = 'prestador@biskate.com' OR u.email = 'admin@biskate.com' THEN true ELSE false END,
  now(),
  now()
FROM auth.users u
WHERE u.email IN ('admin@biskate.com', 'cliente@biskate.com', 'prestador@biskate.com')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_admin = EXCLUDED.is_admin,
  is_provider = EXCLUDED.is_provider,
  updated_at = now();

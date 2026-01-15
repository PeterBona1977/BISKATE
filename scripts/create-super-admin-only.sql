-- Criar apenas um super admin real no Supabase Auth e Profiles

-- Primeiro, vamos limpar qualquer dado de teste existente
DELETE FROM auth.users WHERE email LIKE '%@biskate.com' OR email LIKE '%test%' OR email LIKE '%mock%';
DELETE FROM profiles WHERE email LIKE '%@biskate.com' OR email LIKE '%test%' OR email LIKE '%mock%';

-- Criar o super admin diretamente no auth.users
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
  '{"full_name": "Super Admin BISKATE"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Obter o ID do usuário criado
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@biskate.com';
  
  -- Criar o perfil correspondente
  INSERT INTO profiles (
    id,
    email,
    full_name,
    avatar_url,
    role,
    is_admin,
    is_provider,
    provider_status,
    subscription_plan,
    created_at,
    updated_at
  ) VALUES (
    admin_user_id,
    'admin@biskate.com',
    'Super Admin BISKATE',
    NULL,
    'admin',
    TRUE,
    FALSE,
    NULL,
    'unlimited',
    NOW(),
    NOW()
  );
END $$;

-- Verificar se foi criado corretamente
SELECT 
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.role,
  p.is_admin,
  p.subscription_plan
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@biskate.com';

-- Primeiro, vamos verificar e corrigir a estrutura da tabela profiles
-- Criar apenas um super admin real no Supabase Auth e Profiles

-- Limpar qualquer dado de teste existente
DELETE FROM auth.users WHERE email LIKE '%@biskate.com' OR email LIKE '%test%' OR email LIKE '%mock%';
DELETE FROM public.profiles WHERE email LIKE '%@biskate.com' OR email LIKE '%test%' OR email LIKE '%mock%';

-- Verificar se a tabela profiles existe e tem as colunas necessárias
DO $$
BEGIN
  -- Adicionar colunas que podem estar em falta
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_provider') THEN
    ALTER TABLE public.profiles ADD COLUMN is_provider BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'provider_status') THEN
    ALTER TABLE public.profiles ADD COLUMN provider_status TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_plan') THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_plan TEXT DEFAULT 'free';
  END IF;
END $$;

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

-- Obter o ID do usuário criado e criar o perfil
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@biskate.com';
  
  -- Criar o perfil correspondente usando apenas as colunas que existem
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    role,
    created_at,
    updated_at
  ) VALUES (
    admin_user_id,
    'admin@biskate.com',
    'Super Admin BISKATE',
    NULL,
    'admin',
    NOW(),
    NOW()
  );
  
  -- Atualizar com as colunas adicionais se existirem
  UPDATE public.profiles 
  SET 
    is_admin = TRUE,
    is_provider = FALSE,
    subscription_plan = 'unlimited'
  WHERE id = admin_user_id;
END $$;

-- Verificar se foi criado corretamente
SELECT 
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.role,
  p.created_at
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@biskate.com';

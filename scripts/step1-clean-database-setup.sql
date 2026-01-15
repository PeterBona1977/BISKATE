-- PASSO 1: Setup limpo da base de dados BISKATE (CORRIGIDO)
-- Este script vai criar apenas as tabelas essenciais sem RLS problemático
-- CORRECAO: Garante que profiles.id = auth.users.id

BEGIN;

-- Limpar tudo primeiro (cuidado: isto apaga todos os dados!)
DROP TABLE IF EXISTS public.biskate_responses CASCADE;
DROP TABLE IF EXISTS public.biskates CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Desabilitar RLS em todas as tabelas existentes para evitar problemas
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'ALTER TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- 1. Criar tabela de perfis (SEM RLS por agora)
-- Alterado para garantir 1:1 com users
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'provider', 'admin')),
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'unlimited')),
    responses_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de categorias
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de biskates (trabalhos)
CREATE TABLE public.biskates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id),
    budget DECIMAL(10,2),
    location TEXT,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela de respostas
CREATE TABLE public.biskate_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    biskate_id UUID REFERENCES public.biskates(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    proposed_price DECIMAL(10,2),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir categorias básicas
INSERT INTO public.categories (name, description, icon) VALUES
('Limpeza', 'Serviços de limpeza doméstica e comercial', 'cleaning'),
('Jardinagem', 'Manutenção de jardins e espaços verdes', 'garden'),
('Reparações', 'Reparações domésticas e manutenção', 'tools'),
('Pintura', 'Serviços de pintura interior e exterior', 'paint'),
('Eletricidade', 'Instalações e reparações elétricas', 'electric'),
('Canalizações', 'Serviços de canalizador', 'plumbing');

-- Dar permissões básicas (SEM RLS por agora)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Criar função para criar perfil automaticamente quando user se regista
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilizador'),
        'client'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para novos utilizadores
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Criar utilizador admin de teste (se não existir)
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Tentar encontrar utilizador existente
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'pmbonanca@gmail.com' LIMIT 1;
    
    IF admin_user_id IS NULL THEN
        -- Criar novo utilizador admin (isto só funciona se tiveres permissões de admin)
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
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'pmbonanca@gmail.com',
            crypt('admin123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '',
            '',
            '',
            '',
            ''
        ) RETURNING id INTO admin_user_id;
    END IF;
    
    -- Criar ou atualizar perfil admin (usando ID correto)
    INSERT INTO public.profiles (id, email, full_name, role, plan)
    VALUES (admin_user_id, 'pmbonanca@gmail.com', 'Admin BISKATE', 'admin', 'unlimited')
    ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        plan = 'unlimited',
        updated_at = NOW();
        
END $$;

COMMIT;

-- Verificar se tudo foi criado corretamente
SELECT 'Tabelas criadas:' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

SELECT 'Perfis criados:' as status;
SELECT id, email, role FROM public.profiles;

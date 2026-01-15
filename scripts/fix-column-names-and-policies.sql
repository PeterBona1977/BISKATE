-- Script para corrigir nomes de colunas e políticas RLS
-- Execute este script no SQL Editor do dashboard do Supabase

-- 1. Primeiro, vamos verificar a estrutura real das tabelas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'gigs', 'gig_responses', 'platform_settings')
ORDER BY table_name, ordinal_position;

-- 2. Verificar se a coluna creator_id existe na tabela gigs
DO $$
BEGIN
    -- Se a coluna creator_id não existir, vamos criá-la
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'gigs' 
        AND column_name = 'creator_id'
    ) THEN
        -- Verificar se existe user_id em vez de creator_id
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'gigs' 
            AND column_name = 'user_id'
        ) THEN
            -- Renomear user_id para creator_id
            ALTER TABLE public.gigs RENAME COLUMN user_id TO creator_id;
            RAISE NOTICE 'Coluna user_id renomeada para creator_id na tabela gigs';
        ELSE
            -- Adicionar a coluna creator_id
            ALTER TABLE public.gigs ADD COLUMN creator_id UUID REFERENCES auth.users(id);
            RAISE NOTICE 'Coluna creator_id adicionada à tabela gigs';
        END IF;
    END IF;
END $$;

-- 3. Remover todas as políticas existentes para recriá-las corretamente
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can create gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can update own gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can delete own gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can view responses to own gigs" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can view own responses" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can create responses" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can update own responses" ON public.gig_responses;
DROP POLICY IF EXISTS "Admins can manage platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Users can view platform settings" ON public.platform_settings;

-- 4. Criar políticas para a tabela profiles
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 5. Criar políticas para a tabela gigs
CREATE POLICY "Users can view all gigs"
ON public.gigs
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create gigs"
ON public.gigs
FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update own gigs"
ON public.gigs
FOR UPDATE
USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete own gigs"
ON public.gigs
FOR DELETE
USING (auth.uid() = creator_id);

-- 6. Verificar se a tabela gig_responses existe e tem as colunas corretas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gig_responses') THEN
        -- Verificar se a coluna user_id existe
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'gig_responses' 
            AND column_name = 'user_id'
        ) THEN
            -- Adicionar a coluna user_id se não existir
            ALTER TABLE public.gig_responses ADD COLUMN user_id UUID REFERENCES auth.users(id);
            RAISE NOTICE 'Coluna user_id adicionada à tabela gig_responses';
        END IF;

        -- Criar políticas para gig_responses
        CREATE POLICY "Users can view responses to own gigs"
        ON public.gig_responses
        FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.gigs 
                WHERE gigs.id = gig_responses.gig_id 
                AND gigs.creator_id = auth.uid()
            )
        );

        CREATE POLICY "Users can view own responses"
        ON public.gig_responses
        FOR SELECT
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can create responses"
        ON public.gig_responses
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update own responses"
        ON public.gig_responses
        FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- 7. Criar políticas para platform_settings se a tabela existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'platform_settings') THEN
        CREATE POLICY "Users can view platform settings"
        ON public.platform_settings
        FOR SELECT
        USING (auth.role() = 'authenticated');

        CREATE POLICY "Admins can manage platform settings"
        ON public.platform_settings
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            )
        );
    END IF;
END $$;

-- 8. Verificar se RLS está habilitado em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gig_responses') THEN
        ALTER TABLE public.gig_responses ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'platform_settings') THEN
        ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 9. Mostrar o resultado final
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd, 
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'gigs', 'gig_responses', 'platform_settings')
ORDER BY tablename, policyname;

-- 10. Mostrar estrutura das tabelas para confirmação
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'gigs', 'gig_responses', 'platform_settings')
ORDER BY table_name, ordinal_position;

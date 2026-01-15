-- Script ATUALIZADO para gerenciar políticas RLS do Supabase
-- Verifica existência antes de criar novas políticas
-- Execute este script no SQL Editor do dashboard do Supabase

-- =============================================
-- PARTE 1: VERIFICAÇÃO DE POLÍTICAS EXISTENTES
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '🔍 Verificando políticas existentes...';
    
    -- Exibir políticas existentes para referência
    CREATE TEMP TABLE existing_policies AS
    SELECT schemaname, tablename, policyname
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    RAISE NOTICE '📋 Políticas existentes:';
    FOR r IN (SELECT * FROM existing_policies ORDER BY tablename, policyname) LOOP
        RAISE NOTICE '  - % (tabela: %)', r.policyname, r.tablename;
    END LOOP;
END $$;

-- =============================================
-- PARTE 2: ATUALIZAÇÃO DE POLÍTICAS EXISTENTES
-- =============================================

-- Remover políticas antigas que podem estar causando conflitos
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
                      r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Desabilitar RLS temporariamente
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gigs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories DISABLE ROW LEVEL SECURITY;

-- 1. Atualizar políticas para profiles
DO $$
BEGIN
    -- Criar novas políticas
    CREATE POLICY "Enable read for users on own profile" ON profiles
        FOR SELECT USING (auth.uid() = id);
    RAISE NOTICE '✅ Criada política: Enable read for users on own profile';
    
    CREATE POLICY "Enable update for users on own profile" ON profiles
        FOR UPDATE USING (auth.uid() = id);
    RAISE NOTICE '✅ Criada política: Enable update for users on own profile';
    
    CREATE POLICY "Enable insert for authenticated users" ON profiles
        FOR INSERT WITH CHECK (auth.uid() = id);
    RAISE NOTICE '✅ Criada política: Enable insert for authenticated users';
END $$;

-- 2. Atualizar políticas para gigs
DO $$
BEGIN
    -- Criar novas políticas
    CREATE POLICY "Enable read access for all users" ON gigs
        FOR SELECT USING (true);
    RAISE NOTICE '✅ Criada política: Enable read access for all users';
    
    CREATE POLICY "Enable insert for authenticated users" ON gigs
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE '✅ Criada política: Enable insert for authenticated users';
    
    CREATE POLICY "Enable update for gig owners" ON gigs
        FOR UPDATE USING (auth.uid() = user_id);
    RAISE NOTICE '✅ Criada política: Enable update for gig owners';
END $$;

-- 3. Atualizar políticas para gig_responses
DO $$
BEGIN
    -- Remover políticas existentes com segurança
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view responses to own gigs' AND tablename = 'gig_responses') THEN
        DROP POLICY "Users can view responses to own gigs" ON public.gig_responses;
        RAISE NOTICE '🗑️ Removida política: Users can view responses to own gigs';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own responses' AND tablename = 'gig_responses') THEN
        DROP POLICY "Users can view own responses" ON public.gig_responses;
        RAISE NOTICE '🗑️ Removida política: Users can view own responses';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create responses' AND tablename = 'gig_responses') THEN
        DROP POLICY "Users can create responses" ON public.gig_responses;
        RAISE NOTICE '🗑️ Removida política: Users can create responses';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own responses' AND tablename = 'gig_responses') THEN
        DROP POLICY "Users can update own responses" ON public.gig_responses;
        RAISE NOTICE '🗑️ Removida política: Users can update own responses';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for all users' AND tablename = 'gig_responses') THEN
        DROP POLICY "Enable read access for all users" ON public.gig_responses;
        RAISE NOTICE '🗑️ Removida política: Enable read access for all users';
    END IF;
    
    -- Criar novas políticas
    CREATE POLICY "Users can view responses to own gigs"
    ON public.gig_responses
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.gigs 
        WHERE gigs.id = gig_responses.gig_id 
        AND gigs.author_id = (select auth.uid())
      )
    );
    RAISE NOTICE '✅ Criada política: Users can view responses to own gigs';
    
    CREATE POLICY "Users can view own responses"
    ON public.gig_responses
    FOR SELECT
    USING ((select auth.uid()) = responder_id);
    RAISE NOTICE '✅ Criada política: Users can view own responses';
    
    CREATE POLICY "Users can create responses"
    ON public.gig_responses
    FOR INSERT
    WITH CHECK ((select auth.uid()) = responder_id);
    RAISE NOTICE '✅ Criada política: Users can create responses';
    
    CREATE POLICY "Users can update own responses"
    ON public.gig_responses
    FOR UPDATE
    USING ((select auth.uid()) = responder_id);
    RAISE NOTICE '✅ Criada política: Users can update own responses';
END $$;

-- 4. Atualizar políticas para platform_settings
DO $$
BEGIN
    -- Remover políticas existentes com segurança
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage platform settings' AND tablename = 'platform_settings') THEN
        DROP POLICY "Admins can manage platform settings" ON public.platform_settings;
        RAISE NOTICE '🗑️ Removida política: Admins can manage platform settings';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view platform settings' AND tablename = 'platform_settings') THEN
        DROP POLICY "Users can view platform settings" ON public.platform_settings;
        RAISE NOTICE '🗑️ Removida política: Users can view platform settings';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for all users' AND tablename = 'platform_settings') THEN
        DROP POLICY "Enable read access for all users" ON public.platform_settings;
        RAISE NOTICE '🗑️ Removida política: Enable read access for all users';
    END IF;
    
    -- Criar novas políticas
    CREATE POLICY "Users can view platform settings"
    ON public.platform_settings
    FOR SELECT
    USING ((select auth.role()) = 'authenticated');
    RAISE NOTICE '✅ Criada política: Users can view platform settings';
    
    CREATE POLICY "Admins can manage platform settings"
    ON public.platform_settings
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = (select auth.uid()) 
        AND profiles.role = 'admin'
      )
    );
    RAISE NOTICE '✅ Criada política: Admins can manage platform settings';
END $$;

-- 5. NÃO MODIFICAR políticas para notifications (já existem)
DO $$
BEGIN
    RAISE NOTICE '⚠️ Mantendo políticas existentes para notifications';
END $$;

-- 6. NÃO MODIFICAR políticas para moderation_alerts (já existem)
DO $$
BEGIN
    RAISE NOTICE '⚠️ Mantendo políticas existentes para moderation_alerts';
END $$;

-- 7. NÃO MODIFICAR políticas para feedback (já existem)
DO $$
BEGIN
    RAISE NOTICE '⚠️ Mantendo políticas existentes para feedback';
END $$;

-- 8. NÃO MODIFICAR políticas para contact_views (já existem)
DO $$
BEGIN
    RAISE NOTICE '⚠️ Mantendo políticas existentes para contact_views';
END $$;

-- Políticas para CATEGORIES (públicas)
DO $$
BEGIN
    CREATE POLICY "Enable read access for categories" ON categories
        FOR SELECT USING (true);
    RAISE NOTICE '✅ Criada política: Enable read access for categories';
END $$;

-- Reabilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Garantir permissões
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON categories TO anon, authenticated;
GRANT ALL ON profiles, gigs TO authenticated;

-- =============================================
-- PARTE 3: VERIFICAÇÃO FINAL
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '🔍 Verificando políticas atualizadas...';
    
    -- Exibir políticas atualizadas
    RAISE NOTICE '📋 Políticas atualizadas:';
    FOR r IN (
        SELECT schemaname, tablename, policyname, cmd
        FROM pg_policies 
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname
    ) LOOP
        RAISE NOTICE '  - % (tabela: %, ação: %)', r.policyname, r.tablename, r.cmd;
    END LOOP;
    
    RAISE NOTICE '✅ ATUALIZAÇÃO DE POLÍTICAS CONCLUÍDA COM SUCESSO!';
END $$;

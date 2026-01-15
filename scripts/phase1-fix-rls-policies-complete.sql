-- FASE 1 - CORREÇÃO COMPLETA DAS POLÍTICAS RLS
-- Baseado no diagnóstico aprovado

-- ========================================
-- 1. LIMPEZA COMPLETA DAS POLÍTICAS EXISTENTES
-- ========================================

-- Desabilitar RLS temporariamente para limpeza
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gigs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gig_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas existentes
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Remover políticas da tabela profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
    END LOOP;
    
    -- Remover políticas da tabela gigs
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gigs') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.gigs';
    END LOOP;
    
    -- Remover políticas da tabela gig_responses
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gig_responses') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.gig_responses';
    END LOOP;
    
    -- Remover políticas da tabela platform_settings
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'platform_settings') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.platform_settings';
    END LOOP;
END $$;

-- ========================================
-- 2. POLÍTICAS PARA TABELA PROFILES (CRÍTICO)
-- ========================================

-- Reabilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política 1: Utilizadores podem ver o próprio perfil
CREATE POLICY "users_can_view_own_profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Política 2: Utilizadores podem atualizar o próprio perfil
CREATE POLICY "users_can_update_own_profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Política 3: Sistema pode inserir novos perfis (para registo)
CREATE POLICY "system_can_insert_profiles"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Política 4: ADMINS podem ver TODOS os perfis (CRÍTICO)
CREATE POLICY "admins_can_view_all_profiles"
ON public.profiles
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles admin_profile
        WHERE admin_profile.id = auth.uid() 
        AND admin_profile.role = 'admin'
    )
);

-- Política 5: ADMINS podem atualizar qualquer perfil
CREATE POLICY "admins_can_update_all_profiles"
ON public.profiles
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles admin_profile
        WHERE admin_profile.id = auth.uid() 
        AND admin_profile.role = 'admin'
    )
);

-- ========================================
-- 3. POLÍTICAS PARA TABELA GIGS
-- ========================================

ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;

-- Política 1: Todos podem ver gigs públicos
CREATE POLICY "authenticated_users_can_view_gigs"
ON public.gigs
FOR SELECT
USING (auth.role() = 'authenticated');

-- Política 2: Utilizadores podem criar gigs
CREATE POLICY "users_can_create_gigs"
ON public.gigs
FOR INSERT
WITH CHECK (auth.uid() = author_id);

-- Política 3: Autores podem atualizar próprios gigs
CREATE POLICY "authors_can_update_own_gigs"
ON public.gigs
FOR UPDATE
USING (auth.uid() = author_id);

-- Política 4: Autores podem eliminar próprios gigs
CREATE POLICY "authors_can_delete_own_gigs"
ON public.gigs
FOR DELETE
USING (auth.uid() = author_id);

-- Política 5: ADMINS podem gerir todos os gigs
CREATE POLICY "admins_can_manage_all_gigs"
ON public.gigs
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles admin_profile
        WHERE admin_profile.id = auth.uid() 
        AND admin_profile.role = 'admin'
    )
);

-- ========================================
-- 4. POLÍTICAS PARA TABELA GIG_RESPONSES
-- ========================================

ALTER TABLE public.gig_responses ENABLE ROW LEVEL SECURITY;

-- Política 1: Autores de gigs podem ver respostas aos seus gigs
CREATE POLICY "gig_authors_can_view_responses"
ON public.gig_responses
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.gigs 
        WHERE gigs.id = gig_responses.gig_id 
        AND gigs.author_id = auth.uid()
    )
);

-- Política 2: Utilizadores podem ver as próprias respostas
CREATE POLICY "users_can_view_own_responses"
ON public.gig_responses
FOR SELECT
USING (auth.uid() = responder_id);

-- Política 3: Utilizadores podem criar respostas
CREATE POLICY "users_can_create_responses"
ON public.gig_responses
FOR INSERT
WITH CHECK (auth.uid() = responder_id);

-- Política 4: Utilizadores podem atualizar próprias respostas
CREATE POLICY "users_can_update_own_responses"
ON public.gig_responses
FOR UPDATE
USING (auth.uid() = responder_id);

-- Política 5: ADMINS podem gerir todas as respostas
CREATE POLICY "admins_can_manage_all_responses"
ON public.gig_responses
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles admin_profile
        WHERE admin_profile.id = auth.uid() 
        AND admin_profile.role = 'admin'
    )
);

-- ========================================
-- 5. POLÍTICAS PARA TABELA PLATFORM_SETTINGS
-- ========================================

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Política 1: Utilizadores autenticados podem ver configurações públicas
CREATE POLICY "authenticated_users_can_view_settings"
ON public.platform_settings
FOR SELECT
USING (auth.role() = 'authenticated');

-- Política 2: Apenas ADMINS podem gerir configurações
CREATE POLICY "admins_can_manage_settings"
ON public.platform_settings
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles admin_profile
        WHERE admin_profile.id = auth.uid() 
        AND admin_profile.role = 'admin'
    )
);

-- ========================================
-- 6. VERIFICAÇÃO E VALIDAÇÃO
-- ========================================

-- Verificar políticas aplicadas
SELECT 
    '=== POLÍTICAS RLS APLICADAS ===' as status,
    schemaname,
    tablename, 
    policyname, 
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN '🔍 READ'
        WHEN cmd = 'INSERT' THEN '➕ create'
        WHEN cmd = 'UPDATE' THEN '✏️ update'
        WHEN cmd = 'DELETE' THEN '🗑️ delete'
        WHEN cmd = 'ALL' THEN '🔧 manage'
        ELSE cmd
    END as operation
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'gigs', 'gig_responses', 'platform_settings')
ORDER BY tablename, cmd, policyname;

-- Verificar se RLS está ativo
SELECT 
    '=== STATUS RLS ===' as status,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'gigs', 'gig_responses', 'platform_settings')
ORDER BY tablename;

-- Teste de conectividade básica
SELECT 
    '=== TESTE DE CONECTIVIDADE ===' as status,
    current_user as current_db_user,
    current_database() as database_name,
    now() as timestamp;

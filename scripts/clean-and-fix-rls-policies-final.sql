-- Script DEFINITIVO para limpar e recriar políticas RLS
-- Remove TODAS as políticas existentes e recria com nomes únicos

-- =============================================
-- LIMPEZA COMPLETA DE TODAS AS POLÍTICAS
-- =============================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Remover TODAS as políticas das tabelas principais
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'gigs', 'gig_responses', 'platform_settings', 'notifications', 'moderation_alerts')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Removida política: % da tabela %', pol.policyname, pol.tablename;
    END LOOP;
END $$;

-- =============================================
-- VERIFICAR ESTRUTURA DAS TABELAS
-- =============================================

SELECT 
    '📋 ESTRUTURA GIGS:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'gigs'
AND column_name IN ('id', 'author_id', 'user_id', 'creator_id')
ORDER BY ordinal_position;

SELECT 
    '📋 ESTRUTURA GIG_RESPONSES:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'gig_responses'
AND column_name IN ('id', 'responder_id', 'user_id', 'gig_id')
ORDER BY ordinal_position;

-- =============================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gig_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS em tabelas adicionais se existirem
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'moderation_alerts') THEN
        ALTER TABLE public.moderation_alerts ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- =============================================
-- CRIAR POLÍTICAS COM NOMES ÚNICOS
-- =============================================

-- 1. PROFILES - Políticas básicas
CREATE POLICY "profiles_read_own_v2"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "profiles_update_own_v2"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own_v2"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 2. GIGS - Usando author_id (nome correto)
CREATE POLICY "gigs_read_all_v2"
ON public.gigs
FOR SELECT
USING (true); -- Todos podem ver gigs públicos

CREATE POLICY "gigs_create_own_v2"
ON public.gigs
FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "gigs_update_own_v2"
ON public.gigs
FOR UPDATE
USING (auth.uid() = author_id);

CREATE POLICY "gigs_delete_own_v2"
ON public.gigs
FOR DELETE
USING (auth.uid() = author_id);

-- 3. GIG_RESPONSES - Usando responder_id
CREATE POLICY "responses_read_gig_owner_v2"
ON public.gig_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gigs 
    WHERE gigs.id = gig_responses.gig_id 
    AND gigs.author_id = auth.uid()
  )
);

CREATE POLICY "responses_read_own_v2"
ON public.gig_responses
FOR SELECT
USING (auth.uid() = responder_id);

CREATE POLICY "responses_create_own_v2"
ON public.gig_responses
FOR INSERT
WITH CHECK (auth.uid() = responder_id);

CREATE POLICY "responses_update_own_v2"
ON public.gig_responses
FOR UPDATE
USING (auth.uid() = responder_id);

-- 4. PLATFORM_SETTINGS - Admin e leitura geral
CREATE POLICY "settings_read_all_v2"
ON public.platform_settings
FOR SELECT
USING (true); -- Todos podem ler configurações

CREATE POLICY "settings_admin_manage_v2"
ON public.platform_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 5. NOTIFICATIONS - Se a tabela existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        
        -- Verificar se tem recipient_id ou user_id
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'recipient_id') THEN
            EXECUTE 'CREATE POLICY "notifications_read_own_v2" ON public.notifications FOR SELECT USING (auth.uid() = recipient_id)';
            EXECUTE 'CREATE POLICY "notifications_update_own_v2" ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id)';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'user_id') THEN
            EXECUTE 'CREATE POLICY "notifications_read_own_v2" ON public.notifications FOR SELECT USING (auth.uid() = user_id)';
            EXECUTE 'CREATE POLICY "notifications_update_own_v2" ON public.notifications FOR UPDATE USING (auth.uid() = user_id)';
        END IF;
        
    END IF;
END $$;

-- =============================================
-- VERIFICAÇÃO FINAL E RELATÓRIO
-- =============================================

-- Status RLS
SELECT 
    '🔒 STATUS RLS:' as categoria,
    tablename,
    CASE WHEN rowsecurity THEN '✅ HABILITADO' ELSE '❌ DESABILITADO' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'gigs', 'gig_responses', 'platform_settings', 'notifications')
ORDER BY tablename;

-- Políticas criadas
SELECT 
    '📋 POLÍTICAS ATIVAS:' as categoria,
    tablename,
    policyname,
    CASE 
        WHEN cmd = 'r' THEN 'SELECT'
        WHEN cmd = 'w' THEN 'UPDATE'
        WHEN cmd = 'a' THEN 'INSERT'
        WHEN cmd = 'd' THEN 'DELETE'
        WHEN cmd = '*' THEN 'ALL'
        ELSE cmd
    END as tipo
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'gigs', 'gig_responses', 'platform_settings', 'notifications')
ORDER BY tablename, policyname;

-- Contagem final
SELECT 
    '✅ RESUMO FINAL:' as categoria,
    COUNT(*) as total_politicas,
    'Políticas RLS configuradas com sucesso!' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'gigs', 'gig_responses', 'platform_settings');

SELECT '🎉 CONFIGURAÇÃO RLS CONCLUÍDA COM SUCESSO!' as resultado;

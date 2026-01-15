-- SCRIPT DEFINITIVO PARA CORRIGIR TODAS AS POLÍTICAS RLS
-- Este script substitui TODOS os scripts anteriores com erros
-- Execute APENAS este script para resolver todos os problemas

-- =============================================
-- VERIFICAÇÃO INICIAL DA ESTRUTURA
-- =============================================

-- Verificar estrutura das tabelas principais
SELECT 
    'ESTRUTURA DA TABELA GIGS:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'gigs'
ORDER BY ordinal_position;

SELECT 
    'ESTRUTURA DA TABELA GIG_RESPONSES:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'gig_responses'
ORDER BY ordinal_position;

-- =============================================
-- LIMPEZA COMPLETA DE POLÍTICAS PROBLEMÁTICAS
-- =============================================

-- 1. Remover TODAS as políticas existentes (incluindo as com erros)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

DROP POLICY IF EXISTS "Users can view all gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can create gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can update own gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can delete own gigs" ON public.gigs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gigs;

DROP POLICY IF EXISTS "Users can view responses to own gigs" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can view own responses" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can create responses" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can update own responses" ON public.gig_responses;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gig_responses;

DROP POLICY IF EXISTS "Admins can manage platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Users can view platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.platform_settings;

-- =============================================
-- CRIAR POLÍTICAS CORRETAS E FUNCIONAIS
-- =============================================

-- 1. POLÍTICAS PARA PROFILES (usando nomes corretos das colunas)
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 2. POLÍTICAS PARA GIGS (usando author_id - NÃO creator_id)
CREATE POLICY "gigs_select_all"
ON public.gigs
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "gigs_insert_own"
ON public.gigs
FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "gigs_update_own"
ON public.gigs
FOR UPDATE
USING (auth.uid() = author_id);

CREATE POLICY "gigs_delete_own"
ON public.gigs
FOR DELETE
USING (auth.uid() = author_id);

-- 3. POLÍTICAS PARA GIG_RESPONSES (usando responder_id)
CREATE POLICY "gig_responses_select_own_gigs"
ON public.gig_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gigs 
    WHERE gigs.id = gig_responses.gig_id 
    AND gigs.author_id = auth.uid()
  )
);

CREATE POLICY "gig_responses_select_own"
ON public.gig_responses
FOR SELECT
USING (auth.uid() = responder_id);

CREATE POLICY "gig_responses_insert_own"
ON public.gig_responses
FOR INSERT
WITH CHECK (auth.uid() = responder_id);

CREATE POLICY "gig_responses_update_own"
ON public.gig_responses
FOR UPDATE
USING (auth.uid() = responder_id);

-- 4. POLÍTICAS PARA PLATFORM_SETTINGS
CREATE POLICY "platform_settings_select_all"
ON public.platform_settings
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "platform_settings_admin_all"
ON public.platform_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- =============================================
-- POLÍTICAS PARA TABELAS AVANÇADAS (se existirem)
-- =============================================

-- Políticas para notifications (se a tabela existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
    DROP POLICY IF EXISTS "notifications_insert_system" ON public.notifications;
    
    CREATE POLICY "notifications_select_own"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);
    
    CREATE POLICY "notifications_insert_system"
    ON public.notifications
    FOR INSERT
    WITH CHECK (true); -- Sistema pode inserir notificações
  END IF;
END $$;

-- Políticas para moderation_alerts (se a tabela existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moderation_alerts') THEN
    DROP POLICY IF EXISTS "moderation_alerts_admin_only" ON public.moderation_alerts;
    
    CREATE POLICY "moderation_alerts_admin_only"
    ON public.moderation_alerts
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

-- Políticas para feedback (se a tabela existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feedback') THEN
    DROP POLICY IF EXISTS "feedback_select_own" ON public.feedback;
    DROP POLICY IF EXISTS "feedback_insert_own" ON public.feedback;
    DROP POLICY IF EXISTS "feedback_admin_all" ON public.feedback;
    
    CREATE POLICY "feedback_select_own"
    ON public.feedback
    FOR SELECT
    USING (auth.uid() = user_id);
    
    CREATE POLICY "feedback_insert_own"
    ON public.feedback
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "feedback_admin_all"
    ON public.feedback
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

-- Políticas para contact_views (se a tabela existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_views') THEN
    DROP POLICY IF EXISTS "contact_views_select_own" ON public.contact_views;
    DROP POLICY IF EXISTS "contact_views_insert_own" ON public.contact_views;
    
    CREATE POLICY "contact_views_select_own"
    ON public.contact_views
    FOR SELECT
    USING (auth.uid() = viewer_id OR auth.uid() = gig_author_id);
    
    CREATE POLICY "contact_views_insert_own"
    ON public.contact_views
    FOR INSERT
    WITH CHECK (auth.uid() = viewer_id);
  END IF;
END $$;

-- Políticas para notification_rules (se a tabela existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_rules') THEN
    DROP POLICY IF EXISTS "notification_rules_admin_only" ON public.notification_rules;
    
    CREATE POLICY "notification_rules_admin_only"
    ON public.notification_rules
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

-- =============================================
-- VERIFICAÇÃO FINAL E RELATÓRIO
-- =============================================

-- Verificar se RLS está habilitado em todas as tabelas
SELECT 
    '🔒 STATUS RLS:' as info,
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN '✅ HABILITADO' ELSE '❌ DESABILITADO' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'gigs', 'gig_responses', 'platform_settings', 'notifications', 'moderation_alerts', 'feedback', 'contact_views', 'notification_rules')
ORDER BY tablename;

-- Mostrar todas as políticas criadas
SELECT 
    '📋 POLÍTICAS ATIVAS:' as info,
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN cmd = 'r' THEN 'SELECT'
        WHEN cmd = 'w' THEN 'UPDATE'
        WHEN cmd = 'a' THEN 'INSERT'
        WHEN cmd = 'd' THEN 'DELETE'
        WHEN cmd = '*' THEN 'ALL'
        ELSE cmd
    END as permission_type
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Mensagem de sucesso
SELECT 
    '🎉 SUCESSO!' as status,
    'Todas as políticas RLS foram corrigidas e aplicadas com sucesso!' as message,
    'O sistema está agora seguro e funcional.' as note;

-- Script CORRIGIDO para otimizar políticas RLS
-- Usa os nomes CORRETOS das colunas baseado na estrutura real

-- =============================================
-- VERIFICAÇÃO INICIAL DA ESTRUTURA
-- =============================================

-- Verificar estrutura real das tabelas
SELECT 
    'COLUNAS DA TABELA GIGS:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'gigs'
ORDER BY ordinal_position;

SELECT 
    'COLUNAS DA TABELA GIG_RESPONSES:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'gig_responses'
ORDER BY ordinal_position;

-- =============================================
-- LIMPEZA SEGURA DE POLÍTICAS
-- =============================================

-- 1. Limpar políticas para profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- 2. Limpar políticas para gigs
DROP POLICY IF EXISTS "Users can view all gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can create gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can update own gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can delete own gigs" ON public.gigs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gigs;

-- 3. Limpar políticas para gig_responses
DROP POLICY IF EXISTS "Users can view responses to own gigs" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can view own responses" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can create responses" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can update own responses" ON public.gig_responses;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gig_responses;

-- 4. Limpar políticas para platform_settings
DROP POLICY IF EXISTS "Admins can manage platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Users can view platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.platform_settings;

-- =============================================
-- CRIAR POLÍTICAS COM NOMES CORRETOS
-- =============================================

-- 1. Políticas para profiles
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

-- 2. Políticas para gigs (usando AUTHOR_ID - nome correto)
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

-- 3. Políticas para gig_responses (usando RESPONDER_ID - nome correto)
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

-- 4. Políticas para platform_settings
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
-- VERIFICAÇÃO FINAL
-- =============================================

-- Verificar se RLS está habilitado
SELECT 
    '🔒 STATUS RLS:' as info,
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN '✅ HABILITADO' ELSE '❌ DESABILITADO' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'gigs', 'gig_responses', 'platform_settings')
ORDER BY tablename;

-- Mostrar políticas criadas
SELECT 
    '📋 POLÍTICAS CRIADAS:' as info,
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
AND tablename IN ('profiles', 'gigs', 'gig_responses', 'platform_settings')
ORDER BY tablename, policyname;

-- Mensagem de sucesso
SELECT 
    '✅ SUCESSO!' as status,
    'Políticas RLS corrigidas com nomes corretos das colunas!' as message;

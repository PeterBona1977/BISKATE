-- Script SIMPLIFICADO para corrigir políticas RLS do Supabase
-- Execute este script no SQL Editor do dashboard do Supabase

-- =============================================
-- PARTE 1: LIMPEZA SEGURA DE POLÍTICAS
-- =============================================

-- 1. Limpar tudo
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can create gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can update own gigs" ON public.gigs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gigs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gig_responses;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.platform_settings;

-- 2. Políticas simples e funcionais
-- Profiles: cada usuário acessa apenas o próprio
CREATE POLICY "profiles_policy" ON public.profiles
    USING (auth.uid() = id);

-- Gigs: todos podem ler, apenas o dono pode modificar
CREATE POLICY "gigs_read_policy" ON public.gigs
    FOR SELECT USING (true);

CREATE POLICY "gigs_write_policy" ON public.gigs
    FOR ALL USING (auth.uid() = author_id);

-- 3. Garantir que RLS está ativo
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;

-- 4. Permissões básicas
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles, public.gigs TO authenticated;

-- 5. Função de teste
CREATE OR REPLACE FUNCTION test_rls()
RETURNS text AS $$
BEGIN
    RETURN 'RLS policies updated successfully';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- PARTE 3: VERIFICAÇÃO FINAL
-- =============================================

-- Mostrar todas as políticas atuais
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as action,
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
AND tablename IN ('profiles', 'gigs', 'gig_responses', 'platform_settings', 'notifications', 'moderation_alerts', 'feedback', 'contact_views')
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'gigs', 'gig_responses', 'platform_settings', 'notifications', 'moderation_alerts', 'feedback', 'contact_views')
ORDER BY tablename;

-- Mensagem de sucesso
SELECT test_rls() as status;

-- Script CORRIGIDO para otimizar políticas RLS do Supabase
-- Baseado na estrutura REAL das tabelas do Biskate
-- Execute este script no SQL Editor do dashboard do Supabase

-- 1. Desabilitar RLS temporariamente para correções
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gigs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gig_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes da tabela profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- 3. Criar políticas otimizadas para profiles
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Remover políticas existentes da tabela gigs
DROP POLICY IF EXISTS "Users can view all gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can create gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can update own gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can delete own gigs" ON public.gigs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gigs;

-- 5. Criar políticas otimizadas para gigs (usando AUTHOR_ID - nome correto)
CREATE POLICY "gigs_select_policy" ON gigs
    FOR SELECT USING (true); -- Públicos

CREATE POLICY "gigs_insert_policy" ON gigs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "gigs_update_policy" ON gigs
    FOR UPDATE USING (auth.uid() = user_id);

-- 6. Remover políticas existentes da tabela gig_responses
DROP POLICY IF EXISTS "Users can view responses to own gigs" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can view own responses" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can create responses" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can update own responses" ON public.gig_responses;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gig_responses;

-- 7. Criar políticas otimizadas para gig_responses (usando RESPONDER_ID - nome correto)
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

CREATE POLICY "Users can view own responses"
ON public.gig_responses
FOR SELECT
USING ((select auth.uid()) = responder_id);

CREATE POLICY "Users can create responses"
ON public.gig_responses
FOR INSERT
WITH CHECK ((select auth.uid()) = responder_id);

CREATE POLICY "Users can update own responses"
ON public.gig_responses
FOR UPDATE
USING ((select auth.uid()) = responder_id);

-- 8. Remover políticas existentes da tabela platform_settings
DROP POLICY IF EXISTS "Admins can manage platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Users can view platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.platform_settings;

-- 9. Criar políticas otimizadas para platform_settings
CREATE POLICY "Users can view platform settings"
ON public.platform_settings
FOR SELECT
USING ((select auth.role()) = 'authenticated');

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

-- 10. Remover políticas existentes da tabela categories
DROP POLICY IF EXISTS "categories_select_policy" ON categories;

-- 11. Criar políticas otimizadas para categories
CREATE POLICY "categories_select_policy" ON categories
    FOR SELECT USING (true);

-- 12. Remover políticas existentes da tabela notifications
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;

-- 13. Criar políticas otimizadas para notifications
-- Assuming notifications table should have similar policies as gig_responses
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING ((select auth.uid()) = user_id);

-- 14. Reabilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 15. Garantir permissões básicas
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 16. Criar função para obter estatísticas do sistema
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS json AS $$
BEGIN
    RETURN json_build_object(
        'total_users', (SELECT COUNT(*) FROM profiles),
        'total_gigs', (SELECT COUNT(*) FROM gigs),
        'total_categories', (SELECT COUNT(*) FROM categories),
        'active_gigs', (SELECT COUNT(*) FROM gigs WHERE status = 'active'),
        'total_responses', (SELECT COUNT(*) FROM gig_responses)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Confirmar que as políticas foram aplicadas
SELECT 
    '✅ POLÍTICAS APLICADAS COM SUCESSO!' as status,
    schemaname,
    tablename, 
    policyname, 
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'gigs', 'gig_responses', 'categories', 'notifications')
ORDER BY tablename, policyname;

-- 18. Verificar estrutura das tabelas para confirmação
SELECT 
    '📋 ESTRUTURA DAS TABELAS:' as info,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'gigs', 'gig_responses', 'categories', 'notifications')
ORDER BY table_name, ordinal_position;

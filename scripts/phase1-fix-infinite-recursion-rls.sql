-- FASE 1B - CORREÇÃO CRÍTICA DA RECURSÃO INFINITA RLS
-- Problema: Política admin causa loop infinito ao consultar profiles

-- ========================================
-- 1. DIAGNÓSTICO DA RECURSÃO
-- ========================================

-- Verificar políticas atuais que podem causar recursão
SELECT 
    '=== POLÍTICAS PROBLEMÁTICAS ===' as status,
    policyname,
    cmd,
    qual as condition
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
AND qual LIKE '%profiles%'
ORDER BY policyname;

-- ========================================
-- 2. REMOVER POLÍTICAS RECURSIVAS
-- ========================================

-- Remover as políticas admin que causam recursão
DROP POLICY IF EXISTS "admins_can_view_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_can_update_all_profiles" ON public.profiles;

-- ========================================
-- 3. CRIAR FUNÇÃO AUXILIAR PARA VERIFICAR ADMIN
-- ========================================

-- Função que verifica se o utilizador atual é admin SEM recursão
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM auth.users u
        JOIN public.profiles p ON u.id = p.id
        WHERE u.id = auth.uid()
        AND p.role = 'admin'
    );
$$;

-- Dar permissões para a função
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ========================================
-- 4. POLÍTICAS ADMIN SEM RECURSÃO (MÉTODO 1 - FUNÇÃO)
-- ========================================

-- Política admin para SELECT usando função auxiliar
CREATE POLICY "admins_can_view_all_profiles_v2"
ON public.profiles
FOR SELECT
USING (
    -- Utilizador pode ver próprio perfil OU é admin
    auth.uid() = id OR public.is_admin()
);

-- Política admin para UPDATE usando função auxiliar
CREATE POLICY "admins_can_update_all_profiles_v2"
ON public.profiles
FOR UPDATE
USING (
    -- Utilizador pode atualizar próprio perfil OU é admin
    auth.uid() = id OR public.is_admin()
);

-- ========================================
-- 5. MÉTODO ALTERNATIVO - POLÍTICAS SEPARADAS (BACKUP)
-- ========================================

-- Se o método da função não funcionar, usar políticas separadas:

-- Política para utilizadores normais (próprio perfil)
CREATE POLICY "users_view_own_profile_only"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Política específica para admin conhecido (sem recursão)
-- NOTA: Esta é uma solução temporária mais robusta
CREATE POLICY "specific_admin_full_access"
ON public.profiles
FOR ALL
USING (
    auth.uid() = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid OR  -- ID do admin principal
    auth.email() = 'pmiguelbonanca@gmail.com'  -- Email do admin como fallback
);

-- ========================================
-- 6. VERIFICAÇÃO E TESTE
-- ========================================

-- Verificar políticas aplicadas (deve mostrar as novas sem recursão)
SELECT 
    '=== POLÍTICAS ATUALIZADAS ===' as status,
    policyname,
    cmd,
    CASE 
        WHEN qual LIKE '%profiles%profiles%' THEN '❌ POSSÍVEL RECURSÃO'
        WHEN qual LIKE '%is_admin()%' THEN '✅ FUNÇÃO AUXILIAR'
        WHEN qual LIKE '%auth.uid()%' THEN '✅ DIRETO'
        ELSE '⚠️ VERIFICAR'
    END as safety_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
ORDER BY policyname;

-- Testar função auxiliar
SELECT 
    '=== TESTE FUNÇÃO ADMIN ===' as status,
    auth.uid() as current_user_id,
    public.is_admin() as is_current_user_admin,
    now() as test_timestamp;

-- Verificar se RLS ainda está ativo
SELECT 
    '=== STATUS RLS PROFILES ===' as status,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ATIVO'
        ELSE '❌ RLS DESATIVO'
    END as status_check
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- ========================================
-- 7. LIMPEZA DE POLÍTICAS ÓRFÃS (SE NECESSÁRIO)
-- ========================================

-- Remover outras políticas que possam estar duplicadas
DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;

-- Recriar políticas básicas limpas
CREATE POLICY "users_own_profile_access"
ON public.profiles
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ========================================
-- 8. VERIFICAÇÃO FINAL
-- ========================================

SELECT 
    '=== RESUMO FINAL ===' as status,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN qual LIKE '%profiles%profiles%' THEN 1 END) as potentially_recursive,
    COUNT(CASE WHEN qual LIKE '%is_admin()%' THEN 1 END) as using_function,
    COUNT(CASE WHEN qual LIKE '%auth.uid()%' THEN 1 END) as using_direct_auth
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

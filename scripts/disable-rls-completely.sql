-- DESATIVAR RLS COMPLETAMENTE - EXECUTAR AGORA
-- Este script remove TODAS as políticas e desativa RLS

-- 1. Desativar RLS na tabela profiles
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- Loop através de todas as políticas na tabela profiles
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.profiles';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- 3. Verificar se RLS está desativado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- 4. Dar permissões completas
GRANT ALL PRIVILEGES ON public.profiles TO authenticated;
GRANT ALL PRIVILEGES ON public.profiles TO anon;
GRANT ALL PRIVILEGES ON public.profiles TO service_role;

-- 5. Verificar políticas restantes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- 6. Inserir/atualizar perfil admin
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
    '4bc3eb8c-0cef-4e82-b35c-4e8d36456b51',
    'pmbonanca@gmail.com',
    'Paulo Bonança',
    'admin',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = 'Paulo Bonança',
    updated_at = NOW();

SELECT 'RLS DESATIVADO COM SUCESSO' as status;

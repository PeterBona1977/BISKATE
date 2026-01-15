-- Diagnóstico completo do sistema de autenticação
-- Script SQL válido sem erros de sintaxe

-- 1. Verificar utilizadores existentes
SELECT 
    'Utilizadores na tabela auth.users:' as info,
    COUNT(*) as total
FROM auth.users 
WHERE email IN ('admin@biskate.com', 'user@biskate.com');

-- 2. Verificar perfis existentes
SELECT 
    'Perfis existentes:' as info,
    id,
    email,
    full_name,
    role,
    plan,
    created_at
FROM profiles 
WHERE email IN ('admin@biskate.com', 'user@biskate.com')
ORDER BY email;

-- 3. Verificar se RLS está ativo
SELECT 
    'Status RLS:' as info,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- 4. Verificar políticas RLS
SELECT 
    'Políticas RLS:' as info,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 5. Verificar função de trigger
SELECT 
    'Função handle_new_user existe:' as info,
    COUNT(*) as existe
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 6. Verificar trigger
SELECT 
    'Trigger on_auth_user_created:' as info,
    COUNT(*) as existe
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 7. Teste de inserção de perfil
DO $$
DECLARE
    test_user_id uuid := gen_random_uuid();
    insert_success boolean := false;
BEGIN
    BEGIN
        -- Tentar inserir perfil de teste
        INSERT INTO profiles (
            id,
            email,
            full_name,
            role,
            plan,
            responses_used,
            created_at,
            updated_at
        ) VALUES (
            test_user_id,
            'teste-diagnostico@biskate.com',
            'Teste Diagnóstico',
            'user',
            'free',
            0,
            NOW(),
            NOW()
        );
        
        insert_success := true;
        
        -- Remover perfil de teste imediatamente
        DELETE FROM profiles WHERE id = test_user_id;
        
    EXCEPTION WHEN OTHERS THEN
        insert_success := false;
    END;
    
    -- Inserir resultado do teste
    INSERT INTO profiles (
        id,
        email,
        full_name,
        role,
        plan,
        responses_used,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        CASE WHEN insert_success THEN 'TESTE_SUCESSO' ELSE 'TESTE_FALHOU' END,
        'Resultado do teste de inserção',
        'user',
        'free',
        0,
        NOW(),
        NOW()
    );
    
    -- Remover resultado do teste
    DELETE FROM profiles WHERE email IN ('TESTE_SUCESSO', 'TESTE_FALHOU');
    
END $$;

-- 8. Verificar total de perfis
SELECT 
    'Total de perfis na base:' as info,
    COUNT(*) as total
FROM profiles;

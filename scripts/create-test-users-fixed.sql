-- Criar utilizadores de teste para login
-- Este script cria os utilizadores admin e user para testes

-- Verificar se os utilizadores já existem
DO $$
BEGIN
    -- Verificar utilizadores existentes
    RAISE NOTICE 'Verificando utilizadores existentes...';
    
    -- Mostrar utilizadores atuais
    PERFORM email FROM auth.users WHERE email IN ('admin@biskate.com', 'user@biskate.com');
    
    IF FOUND THEN
        RAISE NOTICE 'Utilizadores de teste já existem na tabela auth.users';
    ELSE
        RAISE NOTICE 'Nenhum utilizador de teste encontrado';
    END IF;
END $$;

-- Verificar perfis existentes
SELECT 
    id,
    email,
    full_name,
    role,
    plan,
    created_at
FROM profiles 
WHERE email IN ('admin@biskate.com', 'user@biskate.com')
ORDER BY email;

-- Verificar se RLS está ativo
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- Verificar políticas RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Testar inserção de perfil (simulação)
DO $$
DECLARE
    test_user_id uuid := gen_random_uuid();
BEGIN
    RAISE NOTICE 'Testando inserção de perfil com ID: %', test_user_id;
    
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
        'teste@biskate.com',
        'Utilizador Teste',
        'user',
        'free',
        0,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Perfil de teste inserido com sucesso!';
    
    -- Remover perfil de teste
    DELETE FROM profiles WHERE id = test_user_id;
    RAISE NOTICE 'Perfil de teste removido';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao inserir perfil de teste: %', SQLERRM;
END $$;

-- Verificar função de trigger
SELECT 
    proname,
    prosrc
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Verificar trigger
SELECT 
    tgname,
    tgtype,
    tgenabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

RAISE NOTICE 'Diagnóstico completo. Verifique os resultados acima.';

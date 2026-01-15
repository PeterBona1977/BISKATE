-- Diagnóstico e correção da foreign key constraint
-- que está a impedir a criação de perfis

-- 1. Verificar a constraint que está a causar o problema
SELECT 
    'Foreign Key Constraints na tabela profiles:' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND contype = 'f';

-- 2. Verificar se existe tabela users ou se deveria ser auth.users
SELECT 
    'Tabelas relacionadas:' as info,
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name IN ('users', 'profiles')
ORDER BY table_schema, table_name;

-- 3. Verificar utilizadores em auth.users
SELECT 
    'Utilizadores em auth.users:' as info,
    COUNT(*) as total
FROM auth.users;

-- 4. Verificar perfis órfãos (sem utilizador correspondente)
SELECT 
    'Perfis órfãos:' as info,
    p.id,
    p.email,
    p.full_name
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- 5. Corrigir a foreign key constraint se necessário
-- Primeiro, remover a constraint incorreta se existir
DO $$
DECLARE
    constraint_exists boolean;
BEGIN
    -- Verificar se existe constraint para tabela 'users' em vez de 'auth.users'
    SELECT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conrelid = 'profiles'::regclass 
        AND contype = 'f'
        AND pg_get_constraintdef(oid) LIKE '%REFERENCES users%'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        -- Remover constraint incorreta
        ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
        
        -- Adicionar constraint correta para auth.users
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_id_fkey 
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key constraint corrigida para referenciar auth.users';
    ELSE
        RAISE NOTICE 'Foreign key constraint já está correta ou não existe';
    END IF;
END $$;

-- 6. Verificar se o trigger handle_new_user existe e está correto
SELECT 
    'Trigger handle_new_user:' as info,
    tgname,
    tgenabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 7. Recriar a função handle_new_user se necessário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
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
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilizador'),
        'user',
        'free',
        0,
        NOW(),
        NOW()
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log do erro mas não falhar o registo
    RAISE WARNING 'Erro ao criar perfil para utilizador %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Recriar o trigger se necessário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 9. Verificar políticas RLS
SELECT 
    'Políticas RLS ativas:' as info,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 10. Teste final - verificar se conseguimos criar um perfil para um utilizador existente
DO $$
DECLARE
    test_user_id uuid;
    profile_exists boolean;
BEGIN
    -- Pegar um utilizador existente de auth.users
    SELECT id INTO test_user_id 
    FROM auth.users 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Verificar se já tem perfil
        SELECT EXISTS (
            SELECT 1 FROM profiles WHERE id = test_user_id
        ) INTO profile_exists;
        
        IF NOT profile_exists THEN
            -- Tentar criar perfil
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
                'Teste Utilizador',
                'user',
                'free',
                0,
                NOW(),
                NOW()
            );
            
            RAISE NOTICE 'Perfil criado com sucesso para utilizador existente';
        ELSE
            RAISE NOTICE 'Utilizador já tem perfil';
        END IF;
    ELSE
        RAISE NOTICE 'Nenhum utilizador encontrado em auth.users';
    END IF;
END $$;

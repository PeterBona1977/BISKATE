-- Script para corrigir role de admin e verificar perfis

-- 1. Verificar utilizadores existentes
SELECT 
    u.id,
    u.email,
    u.created_at as user_created_at
FROM auth.users u
WHERE u.email IN ('pmiguelbonanca@gmail.com', 'admin@biskate.com')
ORDER BY u.created_at;

-- 2. Verificar perfis existentes
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.plan,
    p.created_at as profile_created_at
FROM profiles p
WHERE p.email IN ('pmiguelbonanca@gmail.com', 'admin@biskate.com')
ORDER BY p.created_at;

-- 3. Atualizar role para admin se o perfil existir
UPDATE profiles 
SET 
    role = 'admin',
    updated_at = NOW()
WHERE email = 'pmiguelbonanca@gmail.com';

-- 4. Se não existir perfil para pmiguelbonanca@gmail.com, criar um
DO $$
DECLARE
    user_record RECORD;
    profile_exists BOOLEAN;
BEGIN
    -- Verificar se existe utilizador
    SELECT * INTO user_record 
    FROM auth.users 
    WHERE email = 'pmiguelbonanca@gmail.com';
    
    IF FOUND THEN
        -- Verificar se já existe perfil
        SELECT EXISTS(
            SELECT 1 FROM profiles WHERE id = user_record.id
        ) INTO profile_exists;
        
        IF NOT profile_exists THEN
            -- Criar perfil de admin
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
                user_record.id,
                user_record.email,
                COALESCE(user_record.raw_user_meta_data->>'full_name', 'Pedro Miguel Bonança'),
                'admin',
                'unlimited',
                0,
                NOW(),
                NOW()
            );
            
            RAISE NOTICE 'Perfil de admin criado para: %', user_record.email;
        ELSE
            RAISE NOTICE 'Perfil já existe para: %', user_record.email;
        END IF;
    ELSE
        RAISE NOTICE 'Utilizador não encontrado: pmiguelbonanca@gmail.com';
    END IF;
END $$;

-- 5. Verificar resultado final
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.plan,
    p.created_at
FROM profiles p
WHERE p.email = 'pmiguelbonanca@gmail.com';

-- 6. Verificar políticas RLS para admins
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
WHERE tablename = 'profiles' 
AND policyname LIKE '%admin%';

-- 7. Testar função RPC
SELECT * FROM get_profile_by_id(
    (SELECT id FROM auth.users WHERE email = 'pmiguelbonanca@gmail.com' LIMIT 1)
);

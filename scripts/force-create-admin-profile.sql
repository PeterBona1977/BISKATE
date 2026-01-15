-- Forçar criação do perfil de admin para pmiguelbonanca@gmail.com

DO $$
DECLARE
    user_record RECORD;
    admin_email TEXT := 'pmiguelbonanca@gmail.com';
BEGIN
    -- Buscar utilizador
    SELECT * INTO user_record 
    FROM auth.users 
    WHERE email = admin_email;
    
    IF FOUND THEN
        -- Remover perfil existente se houver
        DELETE FROM profiles WHERE id = user_record.id;
        
        -- Criar novo perfil de admin
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
            admin_email,
            'Pedro Miguel Bonança',
            'admin',
            'unlimited',
            0,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Perfil de admin criado/recriado para: %', admin_email;
        
        -- Verificar resultado
        SELECT 
            id, email, full_name, role, plan
        FROM profiles 
        WHERE id = user_record.id;
        
    ELSE
        RAISE NOTICE 'Utilizador não encontrado: %', admin_email;
    END IF;
END $$;

-- Verificar perfil final
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.plan,
    p.created_at
FROM profiles p
WHERE p.email = 'pmiguelbonanca@gmail.com';

-- Testar função RPC
SELECT * FROM get_profile_by_id(
    (SELECT id FROM auth.users WHERE email = 'pmiguelbonanca@gmail.com' LIMIT 1)
);

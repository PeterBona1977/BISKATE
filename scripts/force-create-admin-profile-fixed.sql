-- Forçar criação do perfil de admin para pmiguelbonanca@gmail.com

DO $$
DECLARE
    user_record RECORD;
    admin_email TEXT := 'pmiguelbonanca@gmail.com';
    profile_count INTEGER;
BEGIN
    -- Buscar utilizador
    SELECT * INTO user_record 
    FROM auth.users 
    WHERE email = admin_email;
    
    IF FOUND THEN
        RAISE NOTICE 'Utilizador encontrado: % (ID: %)', user_record.email, user_record.id;
        
        -- Verificar se perfil existe
        SELECT COUNT(*) INTO profile_count
        FROM profiles 
        WHERE id = user_record.id;
        
        RAISE NOTICE 'Perfis existentes: %', profile_count;
        
        -- Remover perfil existente se houver
        IF profile_count > 0 THEN
            DELETE FROM profiles WHERE id = user_record.id;
            RAISE NOTICE 'Perfil anterior removido';
        END IF;
        
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
        
        RAISE NOTICE 'Perfil de admin criado para: %', admin_email;
        
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

-- Testar função RPC se existir utilizador
DO $$
DECLARE
    user_id UUID;
    profile_data RECORD;
BEGIN
    -- Buscar ID do utilizador
    SELECT id INTO user_id
    FROM auth.users 
    WHERE email = 'pmiguelbonanca@gmail.com';
    
    IF FOUND THEN
        -- Testar função RPC
        SELECT * INTO profile_data
        FROM get_profile_by_id(user_id);
        
        IF FOUND THEN
            RAISE NOTICE 'Função RPC funcionou: % - %', profile_data.email, profile_data.role;
        ELSE
            RAISE NOTICE 'Função RPC não retornou dados';
        END IF;
    END IF;
END $$;

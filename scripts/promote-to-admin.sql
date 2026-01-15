-- Verificar se o usuário existe
DO $$
DECLARE
    user_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM profiles WHERE email = 'pmiguelbonanca@gmail.com') INTO user_exists;
    
    IF user_exists THEN
        -- Atualizar o role para admin
        UPDATE profiles 
        SET role = 'admin', 
            plan = 'unlimited',  -- Opcional: dar plano ilimitado para o admin
            updated_at = NOW()
        WHERE email = 'pmiguelbonanca@gmail.com';
        
        RAISE NOTICE 'Usuário pmiguelbonanca@gmail.com promovido para administrador com sucesso!';
    ELSE
        RAISE NOTICE 'Usuário com email pmiguelbonanca@gmail.com não encontrado!';
    END IF;
END $$;

-- Verificar o resultado
SELECT id, email, full_name, role, plan 
FROM profiles 
WHERE email = 'pmiguelbonanca@gmail.com';

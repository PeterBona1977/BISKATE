-- Remover função existente se existir
DROP FUNCTION IF EXISTS get_profile_by_id(UUID);

-- Criar função RPC para buscar perfil sem restrições RLS
CREATE OR REPLACE FUNCTION get_profile_by_id(user_id UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    role TEXT,
    plan TEXT,
    responses_used INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.full_name,
        p.role,
        p.plan,
        p.responses_used,
        p.created_at,
        p.updated_at
    FROM profiles p
    WHERE p.id = user_id;
END;
$$;

-- Dar permissões para utilizadores autenticados
GRANT EXECUTE ON FUNCTION get_profile_by_id(UUID) TO authenticated;

-- Verificar se a função foi criada
SELECT 
    proname as function_name,
    pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'get_profile_by_id';

-- Testar a função (se houver utilizadores)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Pegar um utilizador de teste
    SELECT id INTO test_user_id 
    FROM auth.users 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testando função com utilizador: %', test_user_id;
        
        -- Testar a função
        PERFORM * FROM get_profile_by_id(test_user_id);
        
        RAISE NOTICE 'Função get_profile_by_id criada e testada com sucesso!';
    ELSE
        RAISE NOTICE 'Nenhum utilizador encontrado para testar a função.';
    END IF;
END $$;

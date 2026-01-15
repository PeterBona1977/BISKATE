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
SELECT proname, prosrc FROM pg_proc WHERE proname = 'get_profile_by_id';

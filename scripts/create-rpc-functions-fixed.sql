-- =====================================================
-- BISKATE - CRIAÇÃO DE FUNÇÕES RPC
-- Executar no Supabase SQL Editor
-- =====================================================

-- Função para obter estatísticas do sistema
CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM public.profiles),
        'total_gigs', (SELECT COUNT(*) FROM public.gigs),
        'total_categories', (SELECT COUNT(*) FROM public.categories),
        'total_proposals', (SELECT COUNT(*) FROM public.proposals),
        'total_conversations', (SELECT COUNT(*) FROM public.conversations),
        'total_messages', (SELECT COUNT(*) FROM public.messages),
        'total_reviews', (SELECT COUNT(*) FROM public.reviews),
        'total_payments', (SELECT COUNT(*) FROM public.payments),
        'active_gigs', (SELECT COUNT(*) FROM public.gigs WHERE status = 'published'),
        'pending_proposals', (SELECT COUNT(*) FROM public.proposals WHERE status = 'pending')
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Função para obter perfil do utilizador
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'id', p.id,
        'email', p.email,
        'full_name', p.full_name,
        'role', p.role,
        'plan', p.plan,
        'avatar_url', p.avatar_url,
        'created_at', p.created_at,
        'updated_at', p.updated_at
    )
    INTO result
    FROM public.profiles p
    WHERE p.id = user_id;
    
    RETURN result;
END;
$$;

-- Função para calcular rating médio
CREATE OR REPLACE FUNCTION public.calculate_average_rating(profile_id UUID)
RETURNS DECIMAL(3,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    avg_rating DECIMAL(3,2);
BEGIN
    SELECT COALESCE(AVG(rating), 0)::DECIMAL(3,2)
    INTO avg_rating
    FROM public.reviews
    WHERE reviewed_id = profile_id;
    
    RETURN avg_rating;
END;
$$;

-- Função para contar gigs ativos
CREATE OR REPLACE FUNCTION public.count_active_gigs(user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    gig_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO gig_count
    FROM public.gigs
    WHERE user_id = user_id AND status = 'published';
    
    RETURN gig_count;
END;
$$;

-- Função para verificar saúde das tabelas
CREATE OR REPLACE FUNCTION public.check_table_health()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'profiles', json_build_object(
            'exists', (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')),
            'count', (SELECT COUNT(*) FROM public.profiles),
            'rls_enabled', (SELECT row_security FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles')
        ),
        'categories', json_build_object(
            'exists', (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories')),
            'count', (SELECT COUNT(*) FROM public.categories),
            'rls_enabled', (SELECT row_security FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories')
        ),
        'gigs', json_build_object(
            'exists', (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gigs')),
            'count', (SELECT COUNT(*) FROM public.gigs),
            'rls_enabled', (SELECT row_security FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gigs')
        ),
        'proposals', json_build_object(
            'exists', (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'proposals')),
            'count', (SELECT COUNT(*) FROM public.proposals),
            'rls_enabled', (SELECT row_security FROM pg_tables WHERE schemaname = 'public' AND tablename = 'proposals')
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Conceder permissões para utilizadores autenticados
GRANT EXECUTE ON FUNCTION public.get_system_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_average_rating(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_active_gigs(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_table_health() TO authenticated;

-- Conceder permissões para utilizadores anónimos (apenas funções seguras)
GRANT EXECUTE ON FUNCTION public.get_system_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.check_table_health() TO anon;

-- Verificar se as funções foram criadas
SELECT 
    'Funções RPC criadas com sucesso!' as status,
    COUNT(*) as total_functions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('get_system_stats', 'get_user_profile', 'calculate_average_rating', 'count_active_gigs', 'check_table_health');

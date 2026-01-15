-- ========================================
-- SCRIPT: Diagnóstico do Problema de Tokens Push
-- Descrição: Verifica configuração e identifica problemas
-- ========================================

-- Verificar se a tabela user_device_tokens existe e sua estrutura
SELECT 
    '🔍 ESTRUTURA DA TABELA user_device_tokens' as status,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_device_tokens' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar políticas RLS ativas
SELECT 
    '🛡️ POLÍTICAS RLS ATIVAS' as status,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_device_tokens'
ORDER BY policyname;

-- Verificar se RLS está habilitado
SELECT 
    '🔒 STATUS RLS' as status,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    forcerowsecurity as force_rls
FROM pg_tables 
WHERE tablename = 'user_device_tokens';

-- Verificar configuração do Firebase
SELECT 
    '🔥 CONFIGURAÇÃO FIREBASE' as status,
    service_name,
    is_enabled,
    config->'projectId' as project_id,
    config->'apiKey' as api_key_exists,
    CASE 
        WHEN config->'serverKey' IS NOT NULL THEN 'Configurado'
        ELSE 'Não configurado'
    END as server_key_status
FROM platform_integrations 
WHERE service_name = 'firebase';

-- Verificar se há tentativas de inserção (logs de erro)
SELECT 
    '📊 DADOS ATUAIS' as status,
    COUNT(*) as total_tokens,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_tokens,
    COUNT(DISTINCT user_id) as unique_users
FROM user_device_tokens;

-- Testar inserção manual para verificar RLS
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Pegar um usuário existente para teste
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        BEGIN
            INSERT INTO user_device_tokens (user_id, token, device_info)
            VALUES (test_user_id, 'test-token-' || extract(epoch from now()), '{"test": true}');
            
            RAISE NOTICE '✅ TESTE DE INSERÇÃO: Sucesso - RLS permite inserções';
            
            -- Limpar teste
            DELETE FROM user_device_tokens WHERE token LIKE 'test-token-%';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ TESTE DE INSERÇÃO: Falhou - %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '⚠️ Nenhum usuário encontrado para teste';
    END IF;
END $$;

-- Verificar permissões da role authenticated
SELECT 
    '🔑 PERMISSÕES DA ROLE' as status,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'user_device_tokens'
AND grantee IN ('authenticated', 'anon', 'public');

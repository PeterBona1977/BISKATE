-- =====================================================
-- RELATÓRIO COMPLETO DE DIAGNÓSTICO DA BASE DE DADOS
-- BISKATE - SUPABASE DATABASE ANALYSIS
-- =====================================================

-- Informações gerais da base de dados
SELECT 
    'DATABASE INFO' as section,
    current_database() as database_name,
    current_user as current_user,
    session_user as session_user,
    version() as postgresql_version;

-- =====================================================
-- 1. ANÁLISE DA TABELA PROFILES
-- =====================================================

-- 1.1 Verificar se a tabela profiles existe
SELECT 
    'PROFILES TABLE EXISTS' as section,
    EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) as table_exists;

-- 1.2 Esquema completo da tabela profiles
SELECT 
    'PROFILES SCHEMA' as section,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 1.3 Restrições da tabela profiles
SELECT 
    'PROFILES CONSTRAINTS' as section,
    constraint_name,
    constraint_type,
    column_name,
    foreign_table_name,
    foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
LEFT JOIN information_schema.key_column_usage fkcu 
    ON rc.unique_constraint_name = fkcu.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'profiles';

-- 1.4 Índices da tabela profiles
SELECT 
    'PROFILES INDEXES' as section,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- 1.5 Exemplo de dados da tabela profiles (primeiras 5 linhas)
SELECT 
    'PROFILES SAMPLE DATA' as section,
    id,
    email,
    full_name,
    role,
    plan,
    responses_used,
    created_at,
    updated_at
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 1.6 Contagem total de registos na tabela profiles
SELECT 
    'PROFILES COUNT' as section,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count,
    COUNT(CASE WHEN role = 'provider' THEN 1 END) as provider_count
FROM public.profiles;

-- =====================================================
-- 2. ANÁLISE DA TABELA AUTH.USERS
-- =====================================================

-- 2.1 Verificar se temos acesso à tabela auth.users
SELECT 
    'AUTH USERS ACCESS' as section,
    EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'auth' 
        AND table_name = 'users'
    ) as auth_users_exists;

-- 2.2 Esquema da tabela auth.users (se acessível)
SELECT 
    'AUTH USERS SCHEMA' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 2.3 Exemplo de dados da tabela auth.users (se acessível)
-- NOTA: Esta query pode falhar se não tivermos permissões
SELECT 
    'AUTH USERS SAMPLE' as section,
    id,
    email,
    role,
    created_at,
    last_sign_in_at,
    email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 2.4 Contagem de utilizadores em auth.users
SELECT 
    'AUTH USERS COUNT' as section,
    COUNT(*) as total_auth_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users
FROM auth.users;

-- =====================================================
-- 3. ANÁLISE DE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- 3.1 Estado do RLS na tabela profiles
SELECT 
    'PROFILES RLS STATUS' as section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- 3.2 Políticas RLS ativas na tabela profiles
SELECT 
    'PROFILES RLS POLICIES' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
ORDER BY policyname;

-- 3.3 Todas as tabelas com RLS ativo
SELECT 
    'ALL RLS ENABLED TABLES' as section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE rowsecurity = true
ORDER BY schemaname, tablename;

-- 3.4 Todas as políticas RLS no schema public
SELECT 
    'ALL PUBLIC POLICIES' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 4. ANÁLISE DE FUNÇÕES E TRIGGERS
-- =====================================================

-- 4.1 Funções no schema public
SELECT 
    'PUBLIC FUNCTIONS' as section,
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    pg_get_function_result(oid) as return_type,
    prosrc as function_body
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- 4.2 Triggers existentes
SELECT 
    'TRIGGERS' as section,
    event_object_schema,
    event_object_table,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema IN ('public', 'auth')
ORDER BY event_object_schema, event_object_table, trigger_name;

-- 4.3 Funções relacionadas com autenticação (procurar por padrões)
SELECT 
    'AUTH RELATED FUNCTIONS' as section,
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    prosrc as function_body
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND (
    proname ILIKE '%auth%' OR 
    proname ILIKE '%user%' OR 
    proname ILIKE '%profile%' OR
    proname ILIKE '%admin%'
)
ORDER BY proname;

-- =====================================================
-- 5. ANÁLISE DE PAPÉIS (ROLES)
-- =====================================================

-- 5.1 Papéis existentes no sistema
SELECT 
    'DATABASE ROLES' as section,
    rolname as role_name,
    rolsuper as is_superuser,
    rolinherit as can_inherit,
    rolcreaterole as can_create_role,
    rolcreatedb as can_create_db,
    rolcanlogin as can_login,
    rolconnlimit as connection_limit
FROM pg_roles 
WHERE rolname NOT LIKE 'pg_%'
ORDER BY rolname;

-- 5.2 Membros dos papéis (role memberships)
SELECT 
    'ROLE MEMBERSHIPS' as section,
    r.rolname as role_name,
    m.rolname as member_name
FROM pg_roles r
JOIN pg_auth_members am ON r.oid = am.roleid
JOIN pg_roles m ON am.member = m.oid
WHERE r.rolname NOT LIKE 'pg_%'
ORDER BY r.rolname, m.rolname;

-- =====================================================
-- 6. OUTRAS TABELAS RELEVANTES
-- =====================================================

-- 6.1 Listar todas as tabelas no schema public
SELECT 
    'PUBLIC TABLES' as section,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 6.2 Verificar tabela gigs (se existir)
SELECT 
    'GIGS TABLE INFO' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'gigs'
ORDER BY ordinal_position;

-- 6.3 Exemplo de dados da tabela gigs (se existir)
SELECT 
    'GIGS SAMPLE DATA' as section,
    id,
    title,
    status,
    author_id,
    created_at
FROM public.gigs 
ORDER BY created_at DESC 
LIMIT 3;

-- 6.4 Verificar tabela gig_responses (se existir)
SELECT 
    'GIG_RESPONSES TABLE INFO' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'gig_responses'
ORDER BY ordinal_position;

-- =====================================================
-- 7. VERIFICAÇÕES DE INTEGRIDADE
-- =====================================================

-- 7.1 Verificar sincronização entre auth.users e profiles
SELECT 
    'USER PROFILE SYNC' as section,
    'auth_users_without_profile' as check_type,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
    'USER PROFILE SYNC' as section,
    'profiles_without_auth_user' as check_type,
    COUNT(*) as count
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL;

-- 7.2 Verificar utilizadores admin
SELECT 
    'ADMIN USERS CHECK' as section,
    p.id,
    p.email,
    p.full_name,
    p.role,
    au.email as auth_email,
    au.email_confirmed_at
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.role = 'admin'
ORDER BY p.created_at;

-- =====================================================
-- 8. CONFIGURAÇÕES DE SEGURANÇA
-- =====================================================

-- 8.1 Verificar configurações de segurança do Supabase
SELECT 
    'SECURITY SETTINGS' as section,
    name as setting_name,
    setting as setting_value
FROM pg_settings 
WHERE name IN (
    'row_security',
    'log_statement',
    'log_min_duration_statement'
)
ORDER BY name;

-- 8.2 Verificar extensões instaladas
SELECT 
    'INSTALLED EXTENSIONS' as section,
    extname as extension_name,
    extversion as version
FROM pg_extension
ORDER BY extname;

-- =====================================================
-- RESUMO FINAL
-- =====================================================

SELECT 
    'DIAGNOSIS SUMMARY' as section,
    'Database diagnosis completed at: ' || NOW()::text as summary;

-- Script para verificar a estrutura das tabelas
-- Execute este script primeiro para ver as colunas reais

-- Verificar estrutura da tabela profiles
SELECT 
    'profiles' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela gigs
SELECT 
    'gigs' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'gigs'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela gig_responses
SELECT 
    'gig_responses' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'gig_responses'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela platform_settings
SELECT 
    'platform_settings' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'platform_settings'
ORDER BY ordinal_position;

-- Verificar políticas RLS existentes
SELECT 
    schemaname,
    tablename, 
    policyname, 
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'gigs', 'gig_responses', 'platform_settings')
ORDER BY tablename, policyname;

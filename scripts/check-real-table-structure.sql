-- Script para verificar a estrutura real das tabelas
-- Execute este script primeiro para identificar os nomes corretos das colunas

-- 1. Verificar estrutura da tabela gigs
SELECT 
    'TABELA GIGS:' as info,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'gigs'
ORDER BY ordinal_position;

-- 2. Verificar estrutura da tabela gig_responses
SELECT 
    'TABELA GIG_RESPONSES:' as info,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'gig_responses'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela profiles
SELECT 
    'TABELA PROFILES:' as info,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. Verificar políticas RLS existentes
SELECT 
    'POLÍTICAS EXISTENTES:' as info,
    schemaname,
    tablename, 
    policyname, 
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'gigs', 'gig_responses', 'platform_settings')
ORDER BY tablename, policyname;

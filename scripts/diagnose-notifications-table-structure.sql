-- DIAGNÓSTICO COMPLETO DA TABELA NOTIFICATIONS
-- Verificar se a tabela existe e sua estrutura atual

-- 1. Verificar se a tabela notifications existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'notifications' 
AND table_schema = 'public';

-- 2. Verificar estrutura atual da tabela notifications
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar foreign keys existentes
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'notifications';

-- 4. Verificar RLS policies existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'notifications';

-- 5. Verificar dados existentes (se houver)
SELECT COUNT(*) as total_notifications FROM public.notifications;

-- 6. Verificar se existe alguma coluna relacionada a usuário
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
AND (column_name ILIKE '%user%' OR column_name ILIKE '%profile%' OR column_name ILIKE '%recipient%');

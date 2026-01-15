-- TESTE DE FUNCIONALIDADE: Verificar se a tabela notifications está correta
-- Versão corrigida sem RAISE NOTICE para compatibilidade com Supabase SQL Editor

-- 1. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar índices
SELECT
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    tablename = 'notifications'
AND
    schemaname = 'public'
ORDER BY
    indexname;

-- 3. Verificar constraints
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE
    tc.table_name = 'notifications'
AND
    tc.table_schema = 'public'
ORDER BY
    tc.constraint_name;

-- 4. Verificar políticas RLS
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    tablename = 'notifications'
ORDER BY
    policyname;

-- 5. Inserir notificação de teste (comentado para evitar duplicações)
-- INSERT INTO public.notifications (title, message, type, read, user_id)
-- VALUES ('Teste de Notificação', 'Esta é uma notificação de teste após correção da estrutura', 'info', false, '00000000-0000-0000-0000-000000000000');

-- 6. Verificar dados (limitado a 5 registros)
SELECT * FROM public.notifications LIMIT 5;

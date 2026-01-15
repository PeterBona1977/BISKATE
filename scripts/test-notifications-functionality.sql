-- TESTE COMPLETO DA FUNCIONALIDADE DE NOTIFICATIONS
-- Verificar se tudo está funcionando corretamente

-- 1. Verificar estrutura final da tabela
SELECT 'Estrutura da tabela notifications:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar foreign keys
SELECT 'Foreign keys da tabela notifications:' as info;
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'notifications';

-- 3. Verificar índices
SELECT 'Índices da tabela notifications:' as info;
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'notifications' 
AND schemaname = 'public';

-- 4. Verificar RLS policies
SELECT 'RLS Policies da tabela notifications:' as info;
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;

-- 5. Criar uma notificação de teste (se houver usuários)
DO $$
DECLARE
    test_user_id uuid;
BEGIN
    -- Buscar um usuário de teste
    SELECT id INTO test_user_id 
    FROM auth.users 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Inserir notificação de teste
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            read
        ) VALUES (
            test_user_id,
            'Teste de Notificação',
            'Esta é uma notificação de teste para verificar se a estrutura está funcionando.',
            'info',
            false
        );
        
        RAISE NOTICE '✅ Notificação de teste criada para usuário: %', test_user_id;
    ELSE
        RAISE NOTICE '⚠️ Nenhum usuário encontrado para teste';
    END IF;
END $$;

-- 6. Verificar dados de teste
SELECT 'Notificações existentes:' as info;
SELECT 
    id,
    user_id,
    title,
    message,
    type,
    read,
    created_at
FROM public.notifications
ORDER BY created_at DESC
LIMIT 5;

RAISE NOTICE '✅ Teste de funcionalidade das notifications concluído!';

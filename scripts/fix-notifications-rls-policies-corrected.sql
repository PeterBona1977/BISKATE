-- CORREÇÃO CRÍTICA: Configurar RLS policies para a tabela notifications
-- Versão corrigida sem RAISE NOTICE para compatibilidade com Supabase SQL Editor

-- 1. Habilitar RLS na tabela notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS notifications_select_policy ON public.notifications;
DROP POLICY IF EXISTS notifications_insert_policy ON public.notifications;
DROP POLICY IF EXISTS notifications_update_policy ON public.notifications;
DROP POLICY IF EXISTS notifications_delete_policy ON public.notifications;

-- 3. Criar política SELECT: usuários podem ver apenas suas próprias notificações
CREATE POLICY notifications_select_policy ON public.notifications
    FOR SELECT
    USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'admin'
    );

-- 4. Criar política INSERT: usuários podem inserir notificações para si mesmos
CREATE POLICY notifications_insert_policy ON public.notifications
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'admin'
    );

-- 5. Criar política UPDATE: usuários podem atualizar apenas suas próprias notificações
CREATE POLICY notifications_update_policy ON public.notifications
    FOR UPDATE
    USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'admin'
    );

-- 6. Criar política DELETE: usuários podem excluir apenas suas próprias notificações
CREATE POLICY notifications_delete_policy ON public.notifications
    FOR DELETE
    USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'admin'
    );

-- 7. Verificar políticas criadas
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

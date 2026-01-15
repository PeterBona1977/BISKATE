-- CORREÇÃO DAS RLS POLICIES PARA A TABELA NOTIFICATIONS
-- Garantir que as policies funcionem com a nova coluna user_id

-- 1. Remover policies existentes (se houver)
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;

-- 2. Criar policies corretas para notifications

-- Policy para SELECT (visualizar notificações)
CREATE POLICY "Users can view own notifications" 
ON public.notifications FOR SELECT 
USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Policy para INSERT (criar notificações)
CREATE POLICY "Users can insert own notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Policy para UPDATE (atualizar notificações - marcar como lida)
CREATE POLICY "Users can update own notifications" 
ON public.notifications FOR UPDATE 
USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Policy para DELETE (remover notificações)
CREATE POLICY "Users can delete own notifications" 
ON public.notifications FOR DELETE 
USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- 3. Verificar policies criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;

RAISE NOTICE '✅ RLS Policies para notifications configuradas com sucesso!';

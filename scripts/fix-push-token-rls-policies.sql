-- ========================================
-- SCRIPT: Correção das Políticas RLS para Tokens Push
-- Descrição: Garante que usuários autenticados possam registrar tokens
-- ========================================

-- Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "user_device_tokens_insert_own" ON public.user_device_tokens;
DROP POLICY IF EXISTS "user_device_tokens_select_own" ON public.user_device_tokens;
DROP POLICY IF EXISTS "user_device_tokens_update_own" ON public.user_device_tokens;
DROP POLICY IF EXISTS "user_device_tokens_delete_own" ON public.user_device_tokens;
DROP POLICY IF EXISTS "user_device_tokens_admin_all" ON public.user_device_tokens;

-- Política para inserir tokens (usuários autenticados podem inserir seus próprios tokens)
CREATE POLICY "user_device_tokens_insert_policy" 
ON public.user_device_tokens 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Política para visualizar tokens (usuários só veem seus próprios tokens)
CREATE POLICY "user_device_tokens_select_policy" 
ON public.user_device_tokens 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Política para atualizar tokens (usuários podem atualizar seus próprios tokens)
CREATE POLICY "user_device_tokens_update_policy" 
ON public.user_device_tokens 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para deletar tokens (usuários podem deletar seus próprios tokens)
CREATE POLICY "user_device_tokens_delete_policy" 
ON public.user_device_tokens 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Política para admins (acesso total)
CREATE POLICY "user_device_tokens_admin_policy" 
ON public.user_device_tokens 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Garantir que RLS está habilitado
ALTER TABLE public.user_device_tokens ENABLE ROW LEVEL SECURITY;

-- Verificar se as políticas foram criadas
SELECT 
    '✅ POLÍTICAS CRIADAS' as status,
    policyname,
    cmd as command,
    permissive
FROM pg_policies 
WHERE tablename = 'user_device_tokens'
ORDER BY policyname;

RAISE NOTICE '🎉 Políticas RLS para tokens push corrigidas com sucesso!';

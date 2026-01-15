-- EXECUTAR NO SUPABASE SQL EDITOR --

-- Adicionar política para permitir que utilizadores insiram as suas próprias transações
-- Isto é necessário para que o frontend consiga registar o pagamento do upgrade
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions"
ON public.transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Garantir que a política de visualização também está correta
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id);

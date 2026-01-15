-- Script para corrigir o erro da coluna "creator_id" não existente
-- Este script substitui as referências incorretas pelos nomes corretos das colunas

-- Primeiro, vamos verificar a estrutura real da tabela gigs
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'gigs'
ORDER BY ordinal_position;

-- 1. Remover políticas existentes da tabela gigs que possam estar usando creator_id
DROP POLICY IF EXISTS "Users can view all gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can create gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can update own gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can delete own gigs" ON public.gigs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gigs;

-- 2. Criar políticas corrigidas para gigs (usando author_id em vez de creator_id)
CREATE POLICY "Users can view all gigs"
ON public.gigs
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create gigs"
ON public.gigs
FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own gigs"
ON public.gigs
FOR UPDATE
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own gigs"
ON public.gigs
FOR DELETE
USING (auth.uid() = author_id);

-- 3. Remover políticas existentes da tabela gig_responses que possam estar referenciando creator_id
DROP POLICY IF EXISTS "Users can view responses to own gigs" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can view own responses" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can create responses" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can update own responses" ON public.gig_responses;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gig_responses;

-- 4. Criar políticas corrigidas para gig_responses
CREATE POLICY "Users can view responses to own gigs"
ON public.gig_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gigs 
    WHERE gigs.id = gig_responses.gig_id 
    AND gigs.author_id = auth.uid()
  )
);

CREATE POLICY "Users can view own responses"
ON public.gig_responses
FOR SELECT
USING (auth.uid() = responder_id);

CREATE POLICY "Users can create responses"
ON public.gig_responses
FOR INSERT
WITH CHECK (auth.uid() = responder_id);

CREATE POLICY "Users can update own responses"
ON public.gig_responses
FOR UPDATE
USING (auth.uid() = responder_id);

-- 5. Verificar as políticas aplicadas
SELECT 
    '✅ POLÍTICAS CORRIGIDAS:' as status,
    schemaname,
    tablename, 
    policyname, 
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('gigs', 'gig_responses')
ORDER BY tablename, policyname;

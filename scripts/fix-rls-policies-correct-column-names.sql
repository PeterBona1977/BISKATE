-- Script corrigido com os nomes corretos das colunas
-- Execute APÓS verificar a estrutura das tabelas

-- 1. Limpar políticas existentes da tabela gigs
DROP POLICY IF EXISTS "Users can view all gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can create gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can update own gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can delete own gigs" ON public.gigs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gigs;

-- 2. Criar políticas corretas para gigs (usando 'author_id' em vez de 'user_id')
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

-- 3. Limpar políticas existentes da tabela gig_responses
DROP POLICY IF EXISTS "Users can view responses to own gigs" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can view own responses" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can create responses" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can update own responses" ON public.gig_responses;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gig_responses;

-- 4. Criar políticas corretas para gig_responses (usando 'responder_id' em vez de 'user_id')
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

-- 5. Limpar e recriar políticas da tabela profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 6. Limpar e recriar políticas da tabela platform_settings
DROP POLICY IF EXISTS "Users can view platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Admins can manage platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.platform_settings;

CREATE POLICY "Users can view platform settings"
ON public.platform_settings
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage platform settings"
ON public.platform_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Verificar as políticas aplicadas
SELECT 
    'POLÍTICAS APLICADAS:' as status,
    schemaname,
    tablename, 
    policyname, 
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'gigs', 'gig_responses', 'platform_settings')
ORDER BY tablename, policyname;

-- Script corrigido para otimizar políticas RLS
-- Baseado na estrutura real das tabelas do Biskate

-- Primeiro, vamos verificar a estrutura da tabela gigs para confirmar o nome da coluna
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'gigs'
ORDER BY ordinal_position;

-- 1. Otimizar políticas da tabela profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- Criar políticas otimizadas para profiles
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK ((select auth.uid()) = id);

-- 2. Otimizar políticas da tabela gigs
-- Primeiro vamos remover as políticas existentes
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gigs;
DROP POLICY IF EXISTS "Users can view all gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can create gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can update own gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can delete own gigs" ON public.gigs;

-- Criar políticas otimizadas para gigs (usando 'author_id' em vez de 'creator_id')
CREATE POLICY "Users can view all gigs"
ON public.gigs
FOR SELECT
USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Users can create gigs"
ON public.gigs
FOR INSERT
WITH CHECK ((select auth.uid()) = author_id);

CREATE POLICY "Users can update own gigs"
ON public.gigs
FOR UPDATE
USING ((select auth.uid()) = author_id);

CREATE POLICY "Users can delete own gigs"
ON public.gigs
FOR DELETE
USING ((select auth.uid()) = author_id);

-- 3. Otimizar políticas da tabela gig_responses
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can view responses to own gigs" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can view own responses" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can create responses" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can update own responses" ON public.gig_responses;

-- Criar políticas otimizadas para gig_responses
CREATE POLICY "Users can view responses to own gigs"
ON public.gig_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gigs 
    WHERE gigs.id = gig_responses.gig_id 
    AND gigs.author_id = (select auth.uid())
  )
);

CREATE POLICY "Users can view own responses"
ON public.gig_responses
FOR SELECT
USING ((select auth.uid()) = responder_id);

CREATE POLICY "Users can create responses"
ON public.gig_responses
FOR INSERT
WITH CHECK ((select auth.uid()) = responder_id);

CREATE POLICY "Users can update own responses"
ON public.gig_responses
FOR UPDATE
USING ((select auth.uid()) = responder_id);

-- 4. Otimizar políticas da tabela platform_settings
DROP POLICY IF EXISTS "Enable read access for all users" ON public.platform_settings;
DROP POLICY IF EXISTS "Admins can manage platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Users can view platform settings" ON public.platform_settings;

-- Criar políticas otimizadas para platform_settings
CREATE POLICY "Users can view platform settings"
ON public.platform_settings
FOR SELECT
USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Admins can manage platform settings"
ON public.platform_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = (select auth.uid()) 
    AND profiles.role = 'admin'
  )
);

-- Verificar as políticas aplicadas
SELECT 
    'Políticas aplicadas:' as status,
    schemaname,
    tablename, 
    policyname, 
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'gigs', 'gig_responses', 'platform_settings')
ORDER BY tablename, policyname;

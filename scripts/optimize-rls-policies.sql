-- Script para otimizar políticas RLS do Supabase
-- Execute este script no SQL Editor do dashboard do Supabase

-- 1. Remover políticas existentes da tabela profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- 2. Criar políticas otimizadas para profiles
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

-- 3. Remover políticas existentes da tabela gigs
DROP POLICY IF EXISTS "Users can view all gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can create gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can update own gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can delete own gigs" ON public.gigs;

-- 4. Criar políticas otimizadas para gigs
CREATE POLICY "Users can view all gigs"
ON public.gigs
FOR SELECT
USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Users can create gigs"
ON public.gigs
FOR INSERT
WITH CHECK ((select auth.uid()) = creator_id);

CREATE POLICY "Users can update own gigs"
ON public.gigs
FOR UPDATE
USING ((select auth.uid()) = creator_id);

CREATE POLICY "Users can delete own gigs"
ON public.gigs
FOR DELETE
USING ((select auth.uid()) = creator_id);

-- 5. Remover políticas existentes da tabela gig_responses
DROP POLICY IF EXISTS "Users can view responses to own gigs" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can view own responses" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can create responses" ON public.gig_responses;
DROP POLICY IF EXISTS "Users can update own responses" ON public.gig_responses;

-- 6. Criar políticas otimizadas para gig_responses
CREATE POLICY "Users can view responses to own gigs"
ON public.gig_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gigs 
    WHERE gigs.id = gig_responses.gig_id 
    AND gigs.creator_id = (select auth.uid())
  )
);

CREATE POLICY "Users can view own responses"
ON public.gig_responses
FOR SELECT
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create responses"
ON public.gig_responses
FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own responses"
ON public.gig_responses
FOR UPDATE
USING ((select auth.uid()) = user_id);

-- 7. Remover políticas existentes da tabela platform_settings
DROP POLICY IF EXISTS "Admins can manage platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Users can view platform settings" ON public.platform_settings;

-- 8. Criar políticas otimizadas para platform_settings
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

-- Confirmar que as políticas foram aplicadas
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'gigs', 'gig_responses', 'platform_settings')
ORDER BY tablename, policyname;

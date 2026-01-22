-- Fix for infinite recursion in RLS policies by using a SECURITY DEFINER function
-- This avoids the circular dependency where policies on 'organization_members' 
-- trigger themselves or other policies in a loop when joining tables.

-- 1. Create helper function to check membership safely (bypassing RLS)
CREATE OR REPLACE FUNCTION public.is_org_member(org_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
$$;

-- 2. Update Organizations Policy
-- Replace the subquery-based policy with one using the secure function
DROP POLICY IF EXISTS "Members can view their own organization" ON public.organizations;

CREATE POLICY "Members can view their own organization" ON public.organizations
    FOR SELECT USING (
        public.is_org_member(id)
    );

-- 3. Update Organization Members Policy
-- "Members can view their own membership" (user_id = auth.uid()) is fine and safe.
-- We only need to fix the one that allows viewing *colleagues*.
DROP POLICY IF EXISTS "Members can view other members in same org" ON public.organization_members;

CREATE POLICY "Members can view other members in same org" ON public.organization_members
    FOR SELECT USING (
        public.is_org_member(organization_id)
    );

-- 4. Update Departments Policy
-- Also optimizing this to use the function for consistency and performance
DROP POLICY IF EXISTS "Members can view their org departments" ON public.departments;

CREATE POLICY "Members can view their org departments" ON public.departments
    FOR SELECT USING (
        public.is_org_member(organization_id)
    );

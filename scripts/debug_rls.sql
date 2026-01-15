-- Check if profile exists for the specific ID found in logs
select count(*) as profile_count from public.profiles where id = '23c2201e-d595-42ca-b1fe-c3a9ebd7ff5f';

-- List all policies on profiles table
select 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where tablename = 'profiles';

-- Check if RLS is enabled on profiles
select relname, relrowsecurity 
from pg_class 
where relname = 'profiles';

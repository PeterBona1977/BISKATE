-- Backfill missing profiles for existing users
-- This script inserts a profile row for any user in auth.users that doesn't have a corresponding row in public.profiles

insert into public.profiles (
  id, 
  email, 
  full_name, 
  role, 
  plan, 
  responses_used, 
  created_at, 
  updated_at
)
select 
  id, 
  email, 
  coalesce(raw_user_meta_data->>'full_name', 'User') as full_name, 
  'client' as role, 
  'free' as plan, 
  0 as responses_used, 
  created_at, 
  now() as updated_at
from auth.users
where id not in (select id from public.profiles);

-- Verify the result
select count(*) as profiles_created from public.profiles 
where created_at > (now() - interval '1 minute');

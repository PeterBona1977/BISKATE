-- Enable RLS on profiles (ensure it is on)
alter table public.profiles enable row level security;

-- Drop existing policies to ensure a clean slate (avoids duplicates/conflicts)
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Everyone can see profiles" on public.profiles;

-- Create comprehensive policies

-- 1. VIEW: Users can see their own profile
create policy "Users can view their own profile"
on public.profiles for select
using ( auth.uid() = id );

-- 2. VIEW: Everyone can see basic profile info (needed for finding providers)
-- Adjust this if you want stricter privacy, but usually profiles are public
create policy "Public profiles are viewable by everyone"
on public.profiles for select
using ( true );

-- 3. UPDATE: Users can update their own profile
create policy "Users can update their own profile"
on public.profiles for update
using ( auth.uid() = id );

-- 4. INSERT: Users can insert their own profile (trigger usually handles this, but good to have)
create policy "Users can insert their own profile"
on public.profiles for insert
with check ( auth.uid() = id );

-- 5. ADMIN: Admins can do everything (optional, depending on your role setup)
-- This assumes you have a way to identify admins, e.g. a claim or a specific table query.
-- Keeping it simple for now to solve the immediate blocking issue.

-- Verify policies created
select * from pg_policies where tablename = 'profiles';

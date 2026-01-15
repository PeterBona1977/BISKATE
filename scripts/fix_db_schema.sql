-- Add portfolio_url to profiles table if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'portfolio_url') then
    alter table public.profiles add column portfolio_url text;
  end if;
end $$;

-- Create providers table if it doesn't exist
create table if not exists public.providers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  experience text,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  application_date timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint providers_user_id_key unique(user_id)
);

-- Enable RLS
alter table public.providers enable row level security;

-- Policies for providers table
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'providers' and policyname = 'Users can view their own provider application') then
    create policy "Users can view their own provider application"
      on public.providers for select
      using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'providers' and policyname = 'Users can insert their own provider application') then
    create policy "Users can insert their own provider application"
      on public.providers for insert
      with check (auth.uid() = user_id);
  end if;
  
  -- Policy for admins to view/update
  -- Note: This assumes existence of profiles table with role column for admin check
  if not exists (select 1 from pg_policies where tablename = 'providers' and policyname = 'Admins can view all provider applications') then
    create policy "Admins can view all provider applications"
      on public.providers for select
      using (
        exists (
          select 1 from public.profiles
          where profiles.id = auth.uid()
          and profiles.role in ('admin', 'super_admin')
        )
      );
  end if;

  if not exists (select 1 from pg_policies where tablename = 'providers' and policyname = 'Admins can update provider applications') then
    create policy "Admins can update provider applications"
      on public.providers for update
      using (
        exists (
          select 1 from public.profiles
          where profiles.id = auth.uid()
          and profiles.role in ('admin', 'super_admin')
        )
      );
  end if;
end $$;

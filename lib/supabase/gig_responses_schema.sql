-- Gig Responses (Proposals) Schema
drop table if exists public.gig_responses cascade;

create table public.gig_responses (
  id uuid default gen_random_uuid() primary key,
  gig_id uuid references public.gigs(id) on delete cascade not null,
  provider_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  proposed_price decimal(10,2),
  estimated_delivery_days integer,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.gig_responses enable row level security;

-- Users can view responses for their own gigs or responses they created
create policy "Users can view their own responses"
  on public.gig_responses
  for select
  using (
    auth.uid() = provider_id 
    or auth.uid() = client_id
  );

-- Providers can create responses
create policy "Providers can create responses"
  on public.gig_responses
  for insert
  with check (
    auth.uid() = provider_id
  );

-- Users can update their own responses
create policy "Users can update their own responses"
  on public.gig_responses
  for update
  using (
    auth.uid() = provider_id 
    or auth.uid() = client_id
  );

-- Admins can view all responses
create policy "Admins can view all responses"
  on public.gig_responses
  for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Indexes
create index idx_gig_responses_gig on public.gig_responses(gig_id);
create index idx_gig_responses_provider on public.gig_responses(provider_id);
create index idx_gig_responses_client on public.gig_responses(client_id);
create index idx_gig_responses_status on public.gig_responses(status);

-- Insert sample data for testing
insert into public.gig_responses (gig_id, provider_id, client_id, message, proposed_price, estimated_delivery_days, status)
select 
  g.id,
  p.id,
  g.user_id,
  'Olá! Tenho experiência nesta área e posso ajudar com este projeto.',
  150.00,
  7,
  'pending'
from public.gigs g
cross join public.profiles p
where p.role = 'provider'
limit 3;

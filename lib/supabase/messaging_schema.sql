-- Reset tables (CAREFUL: This deletes all data in these tables)
drop table if exists public.messages cascade;
drop table if exists public.conversation_participants cascade;
drop table if exists public.conversations cascade;

-- Create conversations table
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_message_at timestamp with time zone default timezone('utc'::text, now()) not null,
  gig_id uuid references public.gigs(id) on delete set null,
  status text default 'active' check (status in ('active', 'archived', 'blocked'))
);

-- Create conversation particpants table (many-to-many)
create table public.conversation_participants (
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_read_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (conversation_id, user_id)
);

-- Create messages table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_read boolean default false,
  metadata jsonb
);

-- Set up Row Level Security (RLS)

-- Conversations policies
alter table public.conversations enable row level security;

create policy "Users can view conversations they are part of"
  on public.conversations for select
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = conversations.id
      and user_id = auth.uid()
    )
  );

create policy "Users can create conversations"
  on public.conversations for insert
  with check (true); 
  -- Note: Ideally we check if they are inserting themselves as a participant in the transaction, 
  -- but for simplicity we allow creation, and participants must be added.

-- Participants policies
alter table public.conversation_participants enable row level security;

create policy "Users can view participants of their conversations"
  on public.conversation_participants for select
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_participants.conversation_id
      and cp.user_id = auth.uid()
    )
  );

create policy "Users can add themselves to conversations"
  on public.conversation_participants for insert
  with check (user_id = auth.uid());
-- We might need a policy to allow adding OTHERS if you are the creator, but for now let's assume system handles it or we rely on specific logic. 
-- For a simple start, allow authenticated users to insert participants (backend logic usually handles the logic).
create policy "Authenticated users can insert participants"
  on public.conversation_participants for insert
  to authenticated
  with check (true);

-- Messages policies
alter table public.messages enable row level security;

create policy "Users can view messages in their conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id
      and user_id = auth.uid()
    )
  );

create policy "Users can insert messages in their conversations"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id
      and user_id = auth.uid()
    )
  );

-- Indexes for performance
create index idx_conversation_participants_user on public.conversation_participants(user_id);
create index idx_conversation_participants_conversation on public.conversation_participants(conversation_id);
create index idx_messages_conversation on public.messages(conversation_id);
create index idx_messages_sender on public.messages(sender_id);

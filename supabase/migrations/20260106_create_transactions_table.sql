create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  amount decimal(10, 2) not null,
  currency text default 'EUR',
  type text check (type in ('credit', 'debit')) not null,
  status text check (status in ('pending', 'completed', 'failed', 'refunded')) default 'completed',
  description text,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table transactions enable row level security;

-- Policy: Users can view their own transactions
create policy "Users can view own transactions"
  on transactions for select
  using (auth.uid() = user_id);

-- Policy: Service role can manage all transactions (implicit, but good to know)

-- Indexes
create index transactions_user_id_idx on transactions(user_id);
create index transactions_created_at_idx on transactions(created_at);

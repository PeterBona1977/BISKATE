-- Moderation System Schema
drop table if exists public.moderation_alerts cascade;
drop table if exists public.moderation_actions cascade;

-- Moderation Alerts Table
create table public.moderation_alerts (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('spam', 'inappropriate', 'scam', 'fake_profile', 'other')),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'dismissed')),
  target_type text not null check (target_type in ('user', 'gig', 'message', 'review')),
  target_id uuid not null,
  reporter_id uuid references public.profiles(id) on delete set null,
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resolved_at timestamp with time zone,
  resolved_by uuid references public.profiles(id) on delete set null
);

-- Moderation Actions Table (log of actions taken)
create table public.moderation_actions (
  id uuid default gen_random_uuid() primary key,
  alert_id uuid references public.moderation_alerts(id) on delete cascade not null,
  moderator_id uuid references public.profiles(id) on delete set null not null,
  action_type text not null check (action_type in ('warn', 'suspend', 'ban', 'delete_content', 'dismiss', 'escalate')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.moderation_alerts enable row level security;
alter table public.moderation_actions enable row level security;

-- Only admins can view/manage moderation alerts
create policy "Admins can manage moderation alerts"
  on public.moderation_alerts
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Admins can manage moderation actions"
  on public.moderation_actions
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Indexes
create index idx_moderation_alerts_status on public.moderation_alerts(status);
create index idx_moderation_alerts_severity on public.moderation_alerts(severity);
create index idx_moderation_alerts_type on public.moderation_alerts(type);
create index idx_moderation_alerts_target on public.moderation_alerts(target_type, target_id);
create index idx_moderation_actions_alert on public.moderation_actions(alert_id);

-- Insert some sample moderation alerts for testing
insert into public.moderation_alerts (type, severity, status, target_type, target_id, description) values
('spam', 'medium', 'pending', 'gig', gen_random_uuid(), 'Possível spam detectado em anúncio'),
('inappropriate', 'high', 'pending', 'message', gen_random_uuid(), 'Linguagem inapropriada em mensagem'),
('fake_profile', 'critical', 'reviewing', 'user', gen_random_uuid(), 'Perfil suspeito com informações falsas');

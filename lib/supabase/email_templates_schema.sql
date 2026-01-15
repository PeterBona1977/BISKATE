-- Email Templates Schema
drop table if exists public.email_templates cascade;

create table public.email_templates (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  slug text not null unique,
  trigger_key text unique, -- New column for system triggers
  category text not null check (category in ('welcome', 'verification', 'notification', 'transactional', 'marketing')),
  subject text not null,
  body text not null,
  variables jsonb default '[]'::jsonb,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.email_templates enable row level security;

-- Only admins can view/edit email templates
create policy "Admins can manage email templates"
  on public.email_templates
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Indexes
create index idx_email_templates_slug on public.email_templates(slug);
create index idx_email_templates_trigger on public.email_templates(trigger_key);
create index idx_email_templates_category on public.email_templates(category);

-- Insert default templates
insert into public.email_templates (name, slug, trigger_key, category, subject, body, variables) values
('Welcome Email', 'welcome', 'user_registered', 'welcome', 'Bem-vindo ao BISKATE!', 
'<h1>Olá {{user_name}}!</h1>
<p>Bem-vindo ao BISKATE, a plataforma de freelancing que conecta prestadores de serviços a clientes.</p>
<p>Estamos felizes por teres juntado à nossa comunidade!</p>
<p><a href="{{dashboard_link}}">Aceder ao Dashboard</a></p>',
'["user_name", "dashboard_link"]'::jsonb),

('Email Verification', 'email-verification', 'email_verification', 'verification', 'Verifica o teu email', 
'<h1>Olá {{user_name}}!</h1>
<p>Por favor, verifica o teu endereço de email clicando no link abaixo:</p>
<p><a href="{{verification_link}}">Verificar Email</a></p>
<p>Este link expira em 24 horas.</p>',
'["user_name", "verification_link"]'::jsonb),

('Password Reset', 'password-reset', 'password_reset', 'transactional', 'Redefinir Password', 
'<h1>Olá {{user_name}}!</h1>
<p>Recebemos um pedido para redefinir a tua password.</p>
<p><a href="{{reset_link}}">Redefinir Password</a></p>
<p>Se não fizeste este pedido, ignora este email.</p>',
'["user_name", "reset_link"]'::jsonb),

('New Message', 'new-message', 'new_message', 'notification', 'Nova mensagem de {{sender_name}}', 
'<h1>Olá {{user_name}}!</h1>
<p>Tens uma nova mensagem de <strong>{{sender_name}}</strong>:</p>
<blockquote>{{message_preview}}</blockquote>
<p><a href="{{message_link}}">Ver Mensagem</a></p>',
'["user_name", "sender_name", "message_preview", "message_link"]'::jsonb),

('Payment Received', 'payment-received', 'payment_received', 'transactional', 'Pagamento Recebido - €{{amount}}', 
'<h1>Olá {{user_name}}!</h1>
<p>Recebeste um pagamento de <strong>€{{amount}}</strong> por {{gig_title}}.</p>
<p>O valor será transferido para a tua conta em 2-3 dias úteis.</p>
<p><a href="{{payment_link}}">Ver Detalhes</a></p>',
'["user_name", "amount", "gig_title", "payment_link"]'::jsonb);

-- Add trigger_key column if it doesn't exist
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'email_templates' and column_name = 'trigger_key') then
    alter table public.email_templates add column trigger_key text unique;
  end if;
end $$;

-- Create index for performance
create index if not exists idx_email_templates_trigger on public.email_templates(trigger_key);

-- Update existing templates with standard triggers based on their slugs
update public.email_templates set trigger_key = 'user_registered' where slug = 'welcome' and trigger_key is null;
update public.email_templates set trigger_key = 'email_verification' where slug = 'email-verification' and trigger_key is null;
update public.email_templates set trigger_key = 'password_reset' where slug = 'password-reset' and trigger_key is null;
update public.email_templates set trigger_key = 'new_message' where slug = 'new-message' and trigger_key is null;
update public.email_templates set trigger_key = 'payment_received' where slug = 'payment-received' and trigger_key is null;

-- Ensure RLS allows admins to manage templates (idempotent policy update)
drop policy if exists "Admins can manage email templates" on public.email_templates;
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

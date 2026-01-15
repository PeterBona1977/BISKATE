-- EXECUTAR NO SUPABASE SQL EDITOR --
-- Rebranding: Atualizar todas as menções de "Biskate" para "GigHub" na base de dados

-- 1. Atualizar Templates de Email
UPDATE public.email_templates 
SET 
  subject = REPLACE(subject, 'Biskate', 'GigHub'),
  body = REPLACE(body, 'Biskate', 'GigHub'),
  name = REPLACE(name, 'Biskate', 'GigHub');

-- Também tratar versões minúsculas ou com letras diferentes se necessário
UPDATE public.email_templates 
SET 
  subject = REPLACE(subject, 'biskate', 'gighub'),
  body = REPLACE(body, 'biskate', 'gighub');

-- 2. Atualizar Notificações In-App (para as que já existem)
UPDATE public.notifications
SET 
  title = REPLACE(title, 'Biskate', 'GigHub'),
  message = REPLACE(message, 'Biskate', 'GigHub');

UPDATE public.notifications
SET 
  title = REPLACE(title, 'biskate', 'gighub'),
  message = REPLACE(message, 'biskate', 'gighub');

-- 3. Atualizar Mensagens de Erro/Sistema se houver
-- (Opcional: Tabelas de configuração ou metadados)

-- Rebranding na base de dados concluído.

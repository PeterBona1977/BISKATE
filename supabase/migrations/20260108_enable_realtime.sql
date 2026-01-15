-- EXECUTAR NO SUPABASE SQL EDITOR --
-- Ativar o Realtime para as tabelas principais

-- 1. Garantir que a publicação existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- 2. Adicionar tabelas à publicação de Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.providers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gigs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_subscriptions;

-- NOTA: Isto permite que o cliente Supabase receba eventos de INSERT/UPDATE/DELETE em tempo real.
-- O RLS continua a aplicar-se, garantindo que os utilizadores só recebem dados a que têm acesso.

-- EXECUTAR NO SUPABASE SQL EDITOR --
-- Este script limpa todos os dados de teste/mock, preservando apenas o Super Admin pedromiguelbonanca@gmail.com

DO $$ 
DECLARE 
    admin_id UUID;
BEGIN
    -- 1. Obter o ID do Super Admin para proteger
    SELECT id INTO admin_id FROM public.profiles WHERE email = 'pedromiguelbonanca@gmail.com';

    IF admin_id IS NULL THEN
        RAISE NOTICE 'Super Admin não encontrado. Abortando para segurança.';
        RETURN;
    END IF;

    -- 2. Limpar Tabelas de Transações e Planos (dados de movimentação)
    DELETE FROM public.transactions;
    DELETE FROM public.user_subscriptions;
    DELETE FROM public.payment_methods;

    -- 3. Limpar Mensagens e Conversas
    DELETE FROM public.messages;
    DELETE FROM public.conversation_participants;
    DELETE FROM public.conversations;

    -- 4. Limpar Gigs e Respostas
    DELETE FROM public.gig_responses;
    DELETE FROM public.gigs;

    -- 5. Limpar Notificações e Feedback
    DELETE FROM public.notifications;
    DELETE FROM public.user_feedback;

    -- 6. Limpar Moderação
    DELETE FROM public.moderation_actions;
    DELETE FROM public.moderation_alerts;

    -- 7. Limpar Candidaturas de Providers
    DELETE FROM public.providers;

    -- 8. Limpar Perfis (EXCEPTO o Super Admin)
    DELETE FROM public.profiles WHERE id != admin_id;

    -- NOTA: As tabelas plan_limits, email_templates e categorias são mantidas 
    -- por serem configurações estruturais do sistema.

    RAISE NOTICE 'Limpeza concluída. Apenas o Super Admin foi preservado.';
END $$;

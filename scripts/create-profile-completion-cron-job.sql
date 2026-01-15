-- Cron Job para Lembretes Automáticos de Completude de Perfil
-- Este script configura execução automática diária

-- 1. Função para enviar lembretes de completude
CREATE OR REPLACE FUNCTION send_completion_reminders()
RETURNS TABLE(
    users_processed INTEGER,
    reminders_sent INTEGER,
    errors_count INTEGER
) AS $$
DECLARE
    user_record RECORD;
    processed_count INTEGER := 0;
    sent_count INTEGER := 0;
    error_count INTEGER := 0;
    notification_data JSONB;
BEGIN
    -- Log início do processo
    INSERT INTO system_logs (event_type, message, created_at)
    VALUES ('completion_reminders', 'Iniciando envio de lembretes de completude', NOW());

    -- Processar utilizadores que precisam de lembretes
    FOR user_record IN 
        SELECT * FROM get_users_needing_completion_reminders()
        LIMIT 100 -- Processar máximo 100 por execução
    LOOP
        processed_count := processed_count + 1;
        
        BEGIN
            -- Preparar dados da notificação
            notification_data := jsonb_build_object(
                'type', 'profile_completion_reminder',
                'completion_percentage', user_record.completion_percentage,
                'reminder_count', user_record.reminder_count + 1,
                'urgency', CASE 
                    WHEN user_record.completion_percentage < 25 THEN 'high'
                    WHEN user_record.completion_percentage < 50 THEN 'medium'
                    ELSE 'low'
                END
            );

            -- Inserir notificação
            INSERT INTO notifications (
                user_id,
                title,
                message,
                type,
                data,
                created_at
            ) VALUES (
                user_record.user_id,
                CASE 
                    WHEN user_record.completion_percentage < 25 THEN '⭐ Complete seu perfil para mais sucesso!'
                    WHEN user_record.completion_percentage < 50 THEN '🚀 Seu perfil está quase pronto!'
                    WHEN user_record.completion_percentage < 75 THEN '⚡ Últimos passos para um perfil perfeito!'
                    ELSE '👍 Finalize seu perfil para máximo impacto!'
                END,
                CASE 
                    WHEN user_record.completion_percentage < 25 THEN 
                        'Um perfil completo é essencial para o sucesso na BISKATE. Complete os campos básicos agora!'
                    WHEN user_record.completion_percentage < 50 THEN 
                        'Você está no meio do caminho! Complete mais alguns campos para se destacar dos outros profissionais.'
                    WHEN user_record.completion_percentage < 75 THEN 
                        'Seu perfil está bem desenvolvido. Complete os últimos detalhes para maximizar suas oportunidades.'
                    ELSE 
                        'Você está quase lá! Complete os últimos campos para ter um perfil 100% otimizado.'
                END,
                'profile_completion',
                notification_data,
                NOW()
            );

            -- Marcar lembrete como enviado
            PERFORM mark_completion_reminder_sent(user_record.user_id);
            
            sent_count := sent_count + 1;

        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            
            -- Log do erro
            INSERT INTO system_logs (event_type, message, error_details, created_at)
            VALUES (
                'completion_reminder_error', 
                'Erro ao enviar lembrete para usuário: ' || user_record.user_id,
                SQLERRM,
                NOW()
            );
        END;
    END LOOP;

    -- Log final do processo
    INSERT INTO system_logs (
        event_type, 
        message, 
        data,
        created_at
    ) VALUES (
        'completion_reminders_completed',
        'Processo de lembretes concluído',
        jsonb_build_object(
            'processed', processed_count,
            'sent', sent_count,
            'errors', error_count
        ),
        NOW()
    );

    RETURN QUERY SELECT processed_count, sent_count, error_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Função para notificações contextuais (após ações)
CREATE OR REPLACE FUNCTION trigger_contextual_completion_notification(
    user_uuid UUID,
    action_type TEXT
)
RETURNS VOID AS $$
DECLARE
    completion_data RECORD;
    should_notify BOOLEAN := FALSE;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    -- Buscar dados de completude
    SELECT completion_percentage, completion_reminder_count, completion_reminder_sent_at
    INTO completion_data
    FROM profiles 
    WHERE user_id = user_uuid;

    -- Verificar se deve notificar
    IF completion_data.completion_percentage < 75 THEN
        -- Verificar se não enviou notificação recentemente
        IF completion_data.completion_reminder_sent_at IS NULL 
           OR completion_data.completion_reminder_sent_at < NOW() - INTERVAL '1 day' THEN
            should_notify := TRUE;
        END IF;
    END IF;

    IF should_notify THEN
        -- Personalizar mensagem baseada na ação
        CASE action_type
            WHEN 'gig_created' THEN
                notification_title := '🎯 Maximize o sucesso do seu gig!';
                notification_message := 'Gigs de perfis completos recebem 3x mais propostas. Complete seu perfil agora!';
            WHEN 'proposal_sent' THEN
                notification_title := '💪 Destaque-se da concorrência!';
                notification_message := 'Um perfil completo aumenta suas chances de ser escolhido. Complete os campos em falta!';
            WHEN 'profile_viewed' THEN
                notification_title := '👀 Alguém viu seu perfil!';
                notification_message := 'Cause uma boa impressão! Complete seu perfil para converter mais visualizações em oportunidades.';
            ELSE
                notification_title := '⭐ Complete seu perfil!';
                notification_message := 'Perfis completos têm muito mais sucesso na plataforma.';
        END CASE;

        -- Inserir notificação
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            data,
            created_at
        ) VALUES (
            user_uuid,
            notification_title,
            notification_message,
            'profile_completion_contextual',
            jsonb_build_object(
                'action_type', action_type,
                'completion_percentage', completion_data.completion_percentage,
                'contextual', true
            ),
            NOW()
        );

        -- Atualizar timestamp do lembrete
        UPDATE profiles 
        SET completion_reminder_sent_at = NOW()
        WHERE user_id = user_uuid;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Função para celebrar completude
CREATE OR REPLACE FUNCTION celebrate_profile_completion(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    user_profile RECORD;
BEGIN
    -- Buscar dados do utilizador
    SELECT p.full_name, p.completion_percentage, au.email
    INTO user_profile
    FROM profiles p
    JOIN auth.users au ON p.user_id = au.id
    WHERE p.user_id = user_uuid;

    -- Celebrar marcos importantes
    IF user_profile.completion_percentage >= 100 THEN
        -- Perfil 100% completo
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            data,
            created_at
        ) VALUES (
            user_uuid,
            '🎉 Parabéns! Perfil 100% Completo!',
            'Fantástico! Seu perfil está perfeito e otimizado para o máximo sucesso na BISKATE. Agora você está pronto para receber as melhores oportunidades!',
            'profile_completion_celebration',
            jsonb_build_object(
                'milestone', 100,
                'achievement', 'perfect_profile',
                'benefits', jsonb_build_array(
                    'Maior visibilidade nos resultados',
                    '3x mais propostas',
                    'Destaque como profissional verificado',
                    'Acesso a gigs premium'
                )
            ),
            NOW()
        );

    ELSIF user_profile.completion_percentage >= 90 THEN
        -- Perfil excelente
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            data,
            created_at
        ) VALUES (
            user_uuid,
            '⭐ Perfil Excelente!',
            'Incrível! Seu perfil está 90% completo e muito bem otimizado. Complete os últimos detalhes para alcançar a perfeição!',
            'profile_completion_celebration',
            jsonb_build_object(
                'milestone', 90,
                'achievement', 'excellent_profile',
                'next_steps', 'Complete os últimos campos para 100%'
            ),
            NOW()
        );

    ELSIF user_profile.completion_percentage >= 80 THEN
        -- Perfil muito bom
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            data,
            created_at
        ) VALUES (
            user_uuid,
            '👍 Ótimo Progresso!',
            'Parabéns! Seu perfil está 80% completo e já está atraindo mais atenção. Continue assim!',
            'profile_completion_milestone',
            jsonb_build_object(
                'milestone', 80,
                'achievement', 'good_profile'
            ),
            NOW()
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar tabela de logs do sistema se não existir
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    error_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_event_type ON system_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- 5. Configurar execução automática (cron job)
-- Nota: Este comando precisa ser executado com privilégios de superusuário
-- SELECT cron.schedule('completion-reminders', '0 10 * * *', 'SELECT send_completion_reminders();');

-- 6. Triggers para notificações contextuais
CREATE OR REPLACE FUNCTION trigger_contextual_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Notificar após criar gig
    IF TG_TABLE_NAME = 'gigs' AND TG_OP = 'INSERT' THEN
        PERFORM trigger_contextual_completion_notification(NEW.user_id, 'gig_created');
    END IF;

    -- Notificar após enviar proposta
    IF TG_TABLE_NAME = 'proposals' AND TG_OP = 'INSERT' THEN
        PERFORM trigger_contextual_completion_notification(NEW.user_id, 'proposal_sent');
    END IF;

    -- Celebrar marcos de completude
    IF TG_TABLE_NAME = 'profiles' AND TG_OP = 'UPDATE' THEN
        -- Verificar se completude aumentou significativamente
        IF (OLD.completion_percentage < 80 AND NEW.completion_percentage >= 80) OR
           (OLD.completion_percentage < 90 AND NEW.completion_percentage >= 90) OR
           (OLD.completion_percentage < 100 AND NEW.completion_percentage >= 100) THEN
            PERFORM celebrate_profile_completion(NEW.user_id);
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers nas tabelas relevantes
DROP TRIGGER IF EXISTS contextual_completion_gigs ON gigs;
CREATE TRIGGER contextual_completion_gigs
    AFTER INSERT ON gigs
    FOR EACH ROW
    EXECUTE FUNCTION trigger_contextual_notifications();

DROP TRIGGER IF EXISTS contextual_completion_proposals ON proposals;
CREATE TRIGGER contextual_completion_proposals
    AFTER INSERT ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION trigger_contextual_notifications();

DROP TRIGGER IF EXISTS celebration_completion_profiles ON profiles;
CREATE TRIGGER celebration_completion_profiles
    AFTER UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_contextual_notifications();

-- 7. Função para estatísticas de performance dos lembretes
CREATE OR REPLACE FUNCTION get_reminder_performance_stats()
RETURNS TABLE(
    total_reminders_sent BIGINT,
    users_who_completed_after_reminder BIGINT,
    avg_completion_increase DECIMAL(5,2),
    reminder_effectiveness_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH reminder_stats AS (
        SELECT 
            COUNT(*) as total_sent,
            COUNT(*) FILTER (
                WHERE EXISTS (
                    SELECT 1 FROM profiles p2 
                    WHERE p2.user_id = profiles.user_id 
                    AND p2.completion_percentage > 80
                    AND p2.updated_at > profiles.completion_reminder_sent_at
                )
            ) as completed_after
        FROM profiles 
        WHERE completion_reminder_sent_at IS NOT NULL
    )
    SELECT 
        rs.total_sent,
        rs.completed_after,
        COALESCE(AVG(p.completion_percentage), 0) as avg_increase,
        CASE 
            WHEN rs.total_sent > 0 THEN 
                ROUND((rs.completed_after::DECIMAL / rs.total_sent::DECIMAL) * 100, 2)
            ELSE 0 
        END as effectiveness
    FROM reminder_stats rs
    CROSS JOIN profiles p
    WHERE p.completion_reminder_sent_at IS NOT NULL
    GROUP BY rs.total_sent, rs.completed_after;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Função para limpeza de dados antigos
CREATE OR REPLACE FUNCTION cleanup_old_completion_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Limpar logs antigos (mais de 90 dias)
    DELETE FROM system_logs 
    WHERE event_type LIKE '%completion%' 
    AND created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log da limpeza
    INSERT INTO system_logs (event_type, message, data, created_at)
    VALUES (
        'completion_cleanup',
        'Limpeza de dados antigos de completude',
        jsonb_build_object('deleted_logs', deleted_count),
        NOW()
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Configurar limpeza automática mensal
-- SELECT cron.schedule('completion-cleanup', '0 2 1 * *', 'SELECT cleanup_old_completion_data();');

-- 10. Comentários e documentação
COMMENT ON FUNCTION send_completion_reminders() IS 'Envia lembretes automáticos de completude de perfil';
COMMENT ON FUNCTION trigger_contextual_completion_notification(UUID, TEXT) IS 'Envia notificações contextuais baseadas em ações do utilizador';
COMMENT ON FUNCTION celebrate_profile_completion(UUID) IS 'Celebra marcos de completude do perfil';
COMMENT ON FUNCTION get_reminder_performance_stats() IS 'Estatísticas de performance dos lembretes';
COMMENT ON FUNCTION cleanup_old_completion_data() IS 'Limpeza automática de dados antigos';

-- Executar primeira verificação de completude
SELECT 'Executando primeira verificação de completude...' as status;
SELECT send_completion_reminders();

-- Sucesso!
SELECT 'Sistema de Cron Jobs para Completude criado com sucesso! 🎉' as status,
       'Lembretes automáticos configurados para execução diária às 10:00' as info;

-- =====================================================
-- BISKATE - DADOS DE EXEMPLO PARA REGRAS DE NOTIFICAÇÃO
-- Inserção de regras de exemplo para testar o sistema
-- =====================================================

-- Limpar regras existentes (opcional - remover se quiser manter)
-- DELETE FROM notification_rules;

-- Inserir regras de notificação de exemplo
INSERT INTO notification_rules (
    name, 
    trigger_event, 
    is_active, 
    target_roles, 
    channels, 
    title_template, 
    message_template,
    conditions
) VALUES 
(
    'Notificar Admin - Novo Gig Criado',
    'gig_created',
    true,
    '{"admin"}',
    '{"app", "email"}',
    'Novo Gig Pendente de Aprovação',
    'Um novo gig "{gig_title}" foi criado por {user_name} e aguarda aprovação.',
    '{}'
),
(
    'Notificar Cliente - Gig Aprovado',
    'gig_approved',
    true,
    '{"client"}',
    '{"app", "email"}',
    'Gig Aprovado com Sucesso',
    'Parabéns! O seu gig "{gig_title}" foi aprovado e está agora visível na plataforma {platform_name}.',
    '{}'
),
(
    'Notificar Cliente - Gig Rejeitado',
    'gig_rejected',
    true,
    '{"client"}',
    '{"app", "email"}',
    'Gig Rejeitado',
    'O seu gig "{gig_title}" foi rejeitado. Motivo: {rejection_reason}. Por favor, revise e tente novamente.',
    '{}'
),
(
    'Notificar Cliente - Nova Resposta',
    'response_received',
    true,
    '{"client"}',
    '{"app"}',
    'Nova Resposta ao Seu Gig',
    'O seu gig "{gig_title}" recebeu uma nova resposta de {user_name}. Verifique os detalhes na plataforma.',
    '{}'
),
(
    'Notificar Prestador - Resposta Aceite',
    'response_accepted',
    true,
    '{"provider"}',
    '{"app", "email"}',
    'Resposta Aceite',
    'Parabéns! A sua resposta ao gig "{gig_title}" foi aceite. Entre em contacto com o cliente para combinar os detalhes.',
    '{}'
),
(
    'Notificar Cliente - Contacto Visualizado',
    'contact_viewed',
    true,
    '{"client"}',
    '{"app"}',
    'Contacto Visualizado',
    'Um prestador visualizou o seu contacto para o gig "{gig_title}". Prepare-se para ser contactado.',
    '{}'
),
(
    'Notificar Admin - Novo Utilizador',
    'user_registered',
    true,
    '{"admin"}',
    '{"app"}',
    'Novo Utilizador Registado',
    'Um novo utilizador {user_name} ({user_email}) registou-se na plataforma {platform_name}.',
    '{}'
),
(
    'Alerta Admin - Conteúdo Sensível',
    'sensitive_content_detected',
    true,
    '{"admin"}',
    '{"app", "email"}',
    'Conteúdo Sensível Detectado',
    'Foi detectado conteúdo sensível no perfil de {user_name}. Padrões detectados: {detected_patterns}. Requer revisão.',
    '{}'
),
(
    'Notificar Admin - Novo Feedback',
    'feedback_received',
    true,
    '{"admin"}',
    '{"app"}',
    'Novo Feedback Recebido',
    'Novo feedback na categoria "{category}" de {user_name}: {subject}',
    '{}'
),
(
    'Alerta Segurança - Múltiplas Tentativas Login',
    'multiple_login_failures',
    true,
    '{"admin"}',
    '{"app", "email"}',
    'Alerta de Segurança',
    'Detectadas {attempt_count} tentativas de login falhadas para {user_email} do IP {ip_address}.',
    '{}'
);

-- Verificar inserção
SELECT 
    name,
    trigger_event,
    is_active,
    target_roles,
    channels,
    created_at
FROM notification_rules 
ORDER BY created_at DESC;

-- Mensagem de sucesso
SELECT 'Regras de notificação de exemplo inseridas com sucesso!' as status;

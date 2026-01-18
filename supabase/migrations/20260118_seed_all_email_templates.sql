-- Migration: Seed All Professional Email Templates (Portuguese) - V2 (Category Fix)
-- Date: 2026-01-18
-- Author: Antigravity

BEGIN;

-- 1. Ensure the table has the trigger_key column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'email_templates' AND column_name = 'trigger_key') THEN
        ALTER TABLE public.email_templates ADD COLUMN trigger_key TEXT UNIQUE;
    END IF;
END $$;

-- 2. Seed/Update Templates
INSERT INTO public.email_templates (slug, name, category, subject, body, trigger_key, is_active)
VALUES
-- USER REGISTRATION & VERIFICATION
(
    'user-registered',
    'Confirmação de Registo',
    'verification',
    'Bem-vindo à GigHub! Confirme o seu email',
    '<h1>Bem-vindo à GigHub!</h1><p>Olá {{user_name}},</p><p>Obrigado por se registar na GigHub. Para começar a explorar e publicar biskates, por favor confirme o seu email clicando no botão abaixo:</p><p><center><a href="{{verification_link}}" class="button">Confirmar Email</a></center></p><p>Se o botão não funcionar, copie e cole este link no seu navegador:</p><p>{{verification_link}}</p><p>Bem-vindo à comunidade!</p>',
    'user_registered',
    true
),
(
    'welcome-confirmed',
    'Bem-vindo (Email Confirmado)',
    'welcome',
    'Conta Confirmada! Bem-vindo à GigHub',
    '<h1>Email Confirmado! 🎉</h1><p>Olá {{user_name}},</p><p>A sua conta na GigHub foi confirmada com sucesso. Já pode aceder ao seu dashboard, completar o seu perfil e começar a criar ou aceitar biskates.</p><p><center><a href="{{dashboard_link}}" class="button">Ir para o Dashboard</a></center></p><p>Estamos felizes por o ter connosco!</p>',
    'welcome_email',
    true
),
(
    'verification-reminder',
    'Lembrete de Verificação',
    'verification',
    'Lembrete: Confirme a sua conta na GigHub',
    '<h1>Ainda não confirmou o seu email?</h1><p>Olá {{user_name}},</p><p>Notámos que ainda não confirmou a sua conta. Para garantir a segurança e o acesso a todas as funcionalidades da GigHub, por favor confirme o seu email:</p><p><center><a href="{{verification_link}}" class="button">Confirmar Agora</a></center></p><p>Se tiver alguma dúvida, a nossa equipa está aqui para ajudar.</p>',
    'verification_reminder',
    true
),

-- GIGS & PROPOSALS
(
    'gig-created',
    'Biskate Criado',
    'notification',
    'O seu Biskate foi criado com sucesso',
    '<h1>Biskate Publicado! 📝</h1><p>Olá {{user_name}},</p><p>O seu biskate "<strong>{{gig_title}}</strong>" foi criado com sucesso e está agora em análise pela nossa equipa de moderação.</p><p>Assim que for aprovado, será notificado e ficará visível para centenas de prestadores qualificados.</p><p><center><a href="{{gig_link}}" class="button">Ver o meu Biskate</a></center></p>',
    'gig_created',
    true
),
(
    'gig-approved',
    'Biskate Aprovado',
    'notification',
    'Boas notícias! O seu Biskate foi aprovado',
    '<h1>Biskate Ativo! ✅</h1><p>Olá {{user_name}},</p><p>Temos o prazer de informar que o seu biskate "<strong>{{gig_title}}</strong>" foi aprovado e já está visível na GigHub.</p><p>Prepare-se para começar a receber propostas em breve!</p><p><center><a href="{{gig_link}}" class="button">Ver Biskate Ativo</a></center></p>',
    'gig_approved',
    true
),
(
    'gig-rejected',
    'Biskate Rejeitado',
    'notification',
    'Atualização sobre o seu Biskate',
    '<h1>Informação sobre o seu Biskate</h1><p>Olá {{user_name}},</p><p>Infelizmente, o seu biskate "<strong>{{gig_title}}</strong>" não pôde ser aprovado neste momento.</p><p><strong>Motivo:</strong> {{rejection_reason}}</p><p>Pode editar o seu biskate e submetê-lo novamente para análise seguindo as nossas diretrizes.</p><p><center><a href="{{edit_link}}" class="button">Editar Biskate</a></center></p>',
    'gig_rejected',
    true
),
(
    'new-proposal',
    'Nova Proposta Recebida',
    'notification',
    'Recebeu uma nova proposta para o seu Biskate',
    '<h1>Nova Proposta! 📩</h1><p>Olá {{user_name}},</p><p>Recebeu uma nova proposta para o seu biskate "<strong>{{gig_title}}</strong>".</p><p><strong>Enviada por:</strong> {{responder_name}}</p><p>Aceda ao seu dashboard para analisar os detalhes e o perfil do prestador.</p><p><center><a href="{{proposals_link}}" class="button">Ver Propostas</a></center></p>',
    'response_received',
    true
),
(
    'proposal-accepted',
    'Proposta Aceite',
    'notification',
    'Parabéns! A sua proposta foi aceite',
    '<h1>Proposta Aceite! 🎉</h1><p>Olá {{user_name}},</p><p>Boas notícias! A sua proposta para o biskate "<strong>{{gig_title}}</strong>" foi aceite pelo cliente.</p><p>Pode agora entrar em contacto direto para combinar os próximos passos e iniciar o trabalho.</p><p><center><a href="{{chat_link}}" class="button">Ir para a Conversa</a></center></p>',
    'response_accepted',
    true
),
(
    'proposal-rejected',
    'Proposta Rejeitada',
    'notification',
    'Atualização sobre a sua proposta',
    '<h1>Informação sobre a sua proposta</h1><p>Olá {{user_name}},</p><p>Infelizmente, a sua proposta para o biskate "<strong>{{gig_title}}</strong>" não foi selecionada desta vez.</p><p>Não desanime! Existem muitos outros biskates à espera da sua experiência na plataforma.</p><p><center><a href="{{browse_link}}" class="button">Explorar Novos Biskates</a></center></p>',
    'response_rejected',
    true
),
(
    'gig-completed',
    'Trabalho Concluído',
    'notification',
    'Trabalho Concluído!',
    '<h1>Biskate Concluído! ✅</h1><p>Olá,</p><p>O biskate "<strong>{{gig_title}}</strong>" foi marcado como concluído com sucesso.</p><p>Não se esqueça de deixar uma avaliação para partilhar a sua experiência com a comunidade GigHub.</p><p><center><a href="{{review_link}}" class="button">Deixar Avaliação</a></center></p>',
    'gig_completed',
    true
),

-- PROVIDERS
(
    'provider-app-received',
    'Candidatura a Prestador Recebida',
    'notification',
    'Recebemos a sua candidatura a Prestador',
    '<h1>Candidatura em Análise 📝</h1><p>Olá {{user_name}},</p><p>Obrigado por se candidatar a ser um prestador oficial na GigHub.</p><p>A nossa equipa irá analisar os seus documentos e competências. Receberá uma resposta no prazo máximo de 48 horas úteis.</p><p>Entretanto, certifique-se de que o seu perfil está o mais completo possível.</p>',
    'provider_application_submitted',
    true
),
(
    'provider-approved',
    'Prestador Aprovado',
    'notification',
    'Parabéns! Já é um Prestador oficial GigHub',
    '<h1>É agora um Prestador Oficial! 🌟</h1><p>Olá {{user_name}},</p><p>Temos o prazer de informar que a sua candidatura a prestador foi aprovada!</p><p>Já pode começar a enviar propostas para biskates na sua área e em Portugal inteiro. Desejamos-lhe muito sucesso!</p><p><center><a href="{{browse_link}}" class="button">Ver Biskates Disponíveis</a></center></p>',
    'provider_approved',
    true
),
(
    'provider-rejected',
    'Prestador Rejeitado',
    'notification',
    'Atualização sobre a sua candidatura a Prestador',
    '<h1>Informação sobre a sua candidatura</h1><p>Olá {{user_name}},</p><p>Infelizmente, a sua candidatura a prestador não pôde ser aprovada neste momento.</p><p><strong>Motivo:</strong> {{rejection_reason}}</p><p>Pode atualizar as informações necessárias e submeter novamente a sua candidatura no futuro.</p>',
    'provider_rejected',
    true
),

-- SECURITY & FEEDBACK
(
    'security-alert-login',
    'Alerta de Segurança',
    'notification',
    'Alerta de Segurança: Múltiplas tentativas de login',
    '<h1>Alerta de Segurança ⚠️</h1><p>Olá,</p><p>Detetámos múltiplas tentativas de login falhadas na sua conta GigHub.</p><p><strong>IP:</strong> {{ipAddress}}<br><strong>Tentativas:</strong> {{attemptCount}}</p><p>Se não foi você, recomendamos que altere a sua password imediatamente para garantir a segurança da sua conta.</p><p><center><a href="{{reset_link}}" class="button">Alterar Password</a></center></p>',
    'multiple_login_failures',
    true
),
(
    'feedback-thank-you',
    'Obrigado pelo Feedback',
    'notification',
    'Obrigado pelo seu feedback',
    '<h1>Obrigado por nos ajudar a crescer! 💬</h1><p>Olá {{user_name}},</p><p>Recebemos o seu feedback sobre "{{subject}}".</p><p>A opinião dos nossos utilizadores é fundamental para continuarmos a melhorar a GigHub. A nossa equipa irá analisar o que nos enviou.</p>',
    'feedback_received',
    true
),
(
    'contact-viewed',
    'Contacto Visualizado',
    'notification',
    'Alguém viu o seu contacto!',
    '<h1>Interesse no seu Perfil! 👁️</h1><p>Olá {{user_name}},</p><p>O utilizador <strong>{{viewer_name}}</strong> visualizou a sua informação de contacto para o biskate "<strong>{{gig_title}}</strong>".</p><p>Este é um excelente sinal de interesse! Esteja atento à sua caixa de entrada e ao chat da plataforma.</p>',
    'contact_viewed',
    true
),

-- EMERGENCIES
(
    'emergency-created',
    'Pedido de Emergência Recebido',
    'notification',
    'PEDIDO DE EMERGÊNCIA: {{gig_title}} 🚨',
    '<h1>EMERGÊNCIA DETETADA 🚨</h1><p>Olá {{user_name}},</p><p>Recebemos o seu pedido de ajuda urgente para "<strong>{{gig_title}}</strong>".</p><p>A nossa rede de prestadores foi alertada e irá receber propostas em minutos. Mantenha o seu telemóvel por perto.</p><p><center><a href="{{emergency_link}}" class="button">Ver Estado da Emergência</a></center></p>',
    'emergency_request_created',
    true
),
(
    'emergency-accepted',
    'Emergência Aceite',
    'notification',
    'Emergência Aceite! Ajuda a caminho 🚑',
    '<h1>Ajuda a caminho! 🏃‍♂️</h1><p>Olá {{user_name}},</p><p>O seu pedido de emergência para "<strong>{{gig_title}}</strong>" foi aceite por <strong>{{responder_name}}</strong>.</p><p>O prestador está a caminho da sua localização. Pode acompanhar o percurso e falar diretamente via chat.</p><p><center><a href="{{chat_link}}" class="button">Falar com Prestador</a></center></p>',
    'emergency_request_accepted',
    true
),

-- PROFILE & CREDITS
(
    'profile-completed',
    'Perfil Completo',
    'notification',
    '🎉 Parabéns! Perfil Completo!',
    '<h1>Perfil 100% Completo! 🏆</h1><p>Olá {{user_name}},</p><p>Excelente trabalho! O seu perfil atingiu a marca dos {{completion_score}}%. Perfis completos têm 3x mais sucesso na GigHub.</p><p>Continue a oferecer um excelente serviço para se tornar um prestador de elite!</p>',
    'profile_completed',
    true
),
(
    'credit-used',
    'Crédito Utilizado',
    'transactional',
    'Crédito Utilizado: {{gig_title}}',
    '<h1>Utilização de Crédito 💰</h1><p>Olá {{user_name}},</p><p>Utilizou {{credits_used}} crédito(s) para interagir com o biskate "<strong>{{gig_title}}</strong>".</p><p>Pode consultar o seu histórico de utilização e saldo no seu dashboard financeiro.</p><p><center><a href="{{wallet_link}}" class="button">Ver Carteira</a></center></p>',
    'credit_used',
    true
),

-- ADMIN ALERTS (Using 'notification' as they aren't transactional/auth)
(
    'admin-new-provider',
    'Nova Candidatura (Admin)',
    'notification',
    '[ADMIN] Nova Candidatura de Prestador Pendente',
    '<h1>Alerta de Administração 📋</h1><p>Uma nova candidatura de prestador foi submetida e aguarda revisão.</p><p><strong>Utilizador:</strong> {{user_name}}<br><strong>Email:</strong> {{user_email}}</p><p><center><a href="{{admin_link}}" class="button">Rever Candidatura</a></center></p>',
    'admin_provider_application',
    true
),
(
    'admin-new-user',
    'Novo Utilizador Confirmado (Admin)',
    'notification',
    '[ADMIN] Novo Utilizador Registado',
    '<h1>Novo Utilizador ✅</h1><p>Um novo utilizador confirmou o seu email na plataforma.</p><p><strong>Nome:</strong> {{user_name}}<br><strong>Email:</strong> {{user_email}}</p><p>Verifique se o número de telefone está correto e se o utilizador necessita de suporte inicial.</p>',
    'admin_user_confirmed',
    true
),
(
    'admin-new-feedback',
    'Novo Feedback (Admin)',
    'notification',
    '[ADMIN] Novo Feedback Recebido',
    '<h1>Novo Feedback 💬</h1><p>Foi recebido novo feedback de um utilizador.</p><p><strong>Utilizador:</strong> {{user_name}}<br><strong>Assunto:</strong> {{subject}}<br><strong>Categoria:</strong> {{category}}</p><p><center><a href="{{admin_feedback_link}}" class="button">Analisar Feedback</a></center></p>',
    'admin_new_feedback',
    true
),
(
    'admin-moderation-alert',
    'Alerta de Moderação (Admin)',
    'notification',
    '[ADMIN] ALERTA: Conteúdo Sensível Detetado ⚠️',
    '<h1>Alerta de Segurança / Moderação ⚠️</h1><p>O sistema de IA detetou conteúdo potencialmente sensível que requer revisão humana.</p><p><strong>Utilizador:</strong> {{user_name}}<br><strong>Tipo:</strong> {{contentType}}<br><strong>Padrões:</strong> {{detectedPatterns}}</p><p><center><a href="{{admin_moderation_link}}" class="button">Rever Conteúdo</a></center></p>',
    'admin_moderation_alert',
    true
),
(
    'admin-manual-verification',
    'Verificação Manual Necessária (Admin)',
    'notification',
    '[ADMIN] ALERTA: Verificação Manual Pendente ⚠️',
    '<h1>Requer Atenção Manual 📋</h1><p>O utilizador <strong>{{user_name}}</strong> ({{user_email}}) falhou a confirmação automática do email após múltiplas tentativas.</p><p>Por favor, analise a conta manualmente para verificar se existe algum problema técnico ou se deve ser aprovada manualmente.</p><p><center><a href="{{admin_user_link}}" class="button">Ver Perfil do Utilizador</a></center></p>',
    'admin_manual_verification',
    true
)
ON CONFLICT (trigger_key) 
DO UPDATE SET 
    subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    category = EXCLUDED.category,
    slug = EXCLUDED.slug,
    name = EXCLUDED.name,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

COMMIT;

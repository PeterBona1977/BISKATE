-- Seed basic email templates to ensure notifications work with professional content
-- EXECUTAR NO SUPABASE SQL EDITOR

INSERT INTO public.email_templates (
    name, slug, subject, body, trigger_key, category, is_active
) VALUES 
(
    'Plan Upgrade Confirmation', 
    'plan-upgraded-provider', 
    'Plano Atualizado! 🚀 - {{plan_name}}', 
    '<h1>Parabéns!</h1><p>Olá {{user_name}},</p><p>O seu plano no GigHub foi atualizado com sucesso para <strong>{{plan_name}}</strong>.</p><p>Obrigado por confiar no nosso serviço para impulsionar o seu negócio.</p><p><a href="{{dashboard_link}}">Ir para o Painel</a></p>', 
    'plan_upgraded', 
    'transactional',
    true
),
(
    'Wallet Topup Confirmation', 
    'wallet-topup-confirmation', 
    'Saldo Adicionado! 💰', 
    '<h1>Recarregamento de Carteira</h1><p>Olá {{user_name}},</p><p>Foram adicionados <strong>€{{amount}}</strong> à sua carteira no GigHub com sucesso.</p><p>O seu saldo atual já reflete este carregamento.</p><p><a href="{{dashboard_link}}">Ver Transações</a></p>', 
    'wallet_topup', 
    'transactional',
    true
),
(
    'Withdrawal Requested', 
    'withdrawal-requested', 
    'Pedido de Levantamento Recebido 💸', 
    '<h1>Pedido de Levantamento</h1><p>Olá {{user_name}},</p><p>Recebemos o seu pedido de levantamento de <strong>€{{amount}}</strong>.</p><p>O seu pedido está agora em análise e será processado nas próximas 48 horas úteis.</p><p><a href="{{dashboard_link}}">Acompanhar Pedido</a></p>', 
    'withdrawal_requested', 
    'transactional',
    true
),
(
    'Admin Alert: Plan Upgrade', 
    'admin-plan-upgrade', 
    'ALERTA ADMIN: Novo Upgrade de Plano 🚀', 
    '<h1>Novo Upgrade</h1><p>O utilizador <strong>{{user_name}}</strong> ({{user_email}}) atualizou para o plano <strong>{{plan_name}}</strong>.</p><p>Verifique os detalhes no painel administrativo.</p>', 
    'admin_plan_upgrade', 
    'notification',
    true
)
ON CONFLICT (slug) DO UPDATE SET
    subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    trigger_key = EXCLUDED.trigger_key,
    category = EXCLUDED.category,
    updated_at = NOW();

-- =====================================================
-- BISKATE - SISTEMA AVANÇADO DE ADMINISTRAÇÃO
-- Criação de tabelas para funcionalidades avançadas
-- =====================================================

-- 1. SISTEMA DE NOTIFICAÇÕES
-- Tabela para armazenar notificações
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'gig_created', 'response_received', 'contact_viewed', etc.
    channel VARCHAR(20) NOT NULL DEFAULT 'app', -- 'app', 'email', 'sms'
    status VARCHAR(20) NOT NULL DEFAULT 'unread', -- 'unread', 'read', 'sent', 'failed'
    related_gig_id UUID REFERENCES gigs(id) ON DELETE SET NULL,
    related_response_id UUID REFERENCES gig_responses(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}', -- Dados adicionais flexíveis
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE
);

-- 2. REGRAS DE NOTIFICAÇÃO (TRIGGERS)
-- Tabela para configurar gatilhos automáticos de notificação
CREATE TABLE IF NOT EXISTS notification_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    trigger_event VARCHAR(100) NOT NULL, -- 'gig_created', 'response_received', etc.
    is_active BOOLEAN DEFAULT true,
    target_roles TEXT[] DEFAULT '{}', -- ['admin', 'client', 'provider']
    channels TEXT[] DEFAULT '{"app"}', -- ['app', 'email', 'sms']
    title_template VARCHAR(255) NOT NULL,
    message_template TEXT NOT NULL,
    conditions JSONB DEFAULT '{}', -- Condições adicionais
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SISTEMA DE DETEÇÃO DE INFORMAÇÃO SENSÍVEL
-- Tabela para armazenar alertas de moderação
CREATE TABLE IF NOT EXISTS moderation_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL, -- 'gig', 'response', 'message'
    content_id UUID NOT NULL, -- ID do gig, response, etc.
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    detected_patterns TEXT[] NOT NULL, -- Padrões detectados
    original_text TEXT NOT NULL,
    highlighted_text TEXT NOT NULL, -- Texto com padrões destacados
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'ignored'
    admin_notes TEXT,
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 4. SISTEMA DE FEEDBACK
-- Tabela para feedback dos utilizadores
CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL, -- 'bug', 'suggestion', 'complaint', 'praise'
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'resolved', 'closed'
    admin_response TEXT,
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 5. CONFIGURAÇÕES DA PLATAFORMA
-- Tabela para configurações gerais (já existe platform_settings, mas vamos expandir)
CREATE TABLE IF NOT EXISTS platform_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(100) NOT NULL, -- 'general', 'monetization', 'features', etc.
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    data_type VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    is_public BOOLEAN DEFAULT false, -- Se pode ser acessado por não-admins
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category, key)
);

-- 6. SISTEMA DE VISUALIZAÇÃO DE CONTACTOS (MONETIZAÇÃO)
-- Tabela para rastrear visualizações de contacto
CREATE TABLE IF NOT EXISTS contact_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    viewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Quem visualizou
    gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE, -- Gig relacionado
    gig_author_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Dono do gig
    credits_used INTEGER DEFAULT 1, -- Créditos gastos
    view_type VARCHAR(50) DEFAULT 'full_contact', -- Tipo de visualização
    metadata JSONB DEFAULT '{}', -- Dados adicionais
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(viewer_id, gig_id) -- Um utilizador só pode ver contacto uma vez por gig
);

-- 7. CATEGORIAS DE GIGS (para gestão)
CREATE TABLE IF NOT EXISTS gig_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50), -- Nome do ícone
    color VARCHAR(20), -- Cor da categoria
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para notificações
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Índices para alertas de moderação
CREATE INDEX IF NOT EXISTS idx_moderation_alerts_status ON moderation_alerts(status);
CREATE INDEX IF NOT EXISTS idx_moderation_alerts_user ON moderation_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_alerts_created_at ON moderation_alerts(created_at);

-- Índices para feedback
CREATE INDEX IF NOT EXISTS idx_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON user_feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON user_feedback(created_at);

-- Índices para visualizações de contacto
CREATE INDEX IF NOT EXISTS idx_contact_views_viewer ON contact_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_contact_views_gig ON contact_views(gig_id);
CREATE INDEX IF NOT EXISTS idx_contact_views_created_at ON contact_views(created_at);

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Ativar RLS nas novas tabelas
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_categories ENABLE ROW LEVEL SECURITY;

-- Políticas para NOTIFICATIONS
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Admins can view all notifications" ON notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para MODERATION_ALERTS (apenas admins)
CREATE POLICY "Only admins can access moderation alerts" ON moderation_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para USER_FEEDBACK
CREATE POLICY "Users can view their own feedback" ON user_feedback
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create feedback" ON user_feedback
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all feedback" ON user_feedback
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para PLATFORM_CONFIG
CREATE POLICY "Public configs are readable by all" ON platform_config
    FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can manage all configs" ON platform_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para CONTACT_VIEWS
CREATE POLICY "Users can view their own contact views" ON contact_views
    FOR SELECT USING (viewer_id = auth.uid());

CREATE POLICY "Users can create contact views" ON contact_views
    FOR INSERT WITH CHECK (viewer_id = auth.uid());

CREATE POLICY "Admins can view all contact views" ON contact_views
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para GIG_CATEGORIES
CREATE POLICY "Everyone can view active categories" ON gig_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON gig_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir regras de notificação padrão
INSERT INTO notification_rules (name, trigger_event, target_roles, title_template, message_template) VALUES
('Novo Gig Criado', 'gig_created', '{"admin"}', 'Novo Gig Pendente', 'Um novo gig "{gig_title}" foi criado e aguarda aprovação.'),
('Resposta Recebida', 'response_received', '{"client"}', 'Nova Resposta ao Seu Gig', 'O seu gig "{gig_title}" recebeu uma nova resposta.'),
('Gig Aprovado', 'gig_approved', '{"client"}', 'Gig Aprovado', 'O seu gig "{gig_title}" foi aprovado e está agora visível.'),
('Gig Rejeitado', 'gig_rejected', '{"client"}', 'Gig Rejeitado', 'O seu gig "{gig_title}" foi rejeitado. Motivo: {rejection_reason}'),
('Contacto Visualizado', 'contact_viewed', '{"client"}', 'Contacto Visualizado', 'Um prestador visualizou o seu contacto para o gig "{gig_title}".');

-- Inserir categorias padrão
INSERT INTO gig_categories (name, description, icon, color, sort_order) VALUES
('Limpeza', 'Serviços de limpeza doméstica e comercial', 'Sparkles', '#3B82F6', 1),
('Jardinagem', 'Cuidados com jardins e plantas', 'Trees', '#10B981', 2),
('Reparações', 'Reparações domésticas e manutenção', 'Wrench', '#F59E0B', 3),
('Transporte', 'Serviços de transporte e mudanças', 'Truck', '#8B5CF6', 4),
('Cozinha', 'Serviços de culinária e catering', 'ChefHat', '#EF4444', 5),
('Tecnologia', 'Suporte técnico e informático', 'Monitor', '#06B6D4', 6),
('Animais', 'Cuidados com animais de estimação', 'Heart', '#EC4899', 7),
('Outros', 'Outros serviços diversos', 'MoreHorizontal', '#6B7280', 8);

-- Inserir configurações padrão da plataforma
INSERT INTO platform_config (category, key, value, data_type, description, is_public) VALUES
('general', 'platform_name', 'BISKATE', 'string', 'Nome da plataforma', true),
('general', 'contact_email', 'admin@biskate.com', 'string', 'Email de contacto', true),
('general', 'support_phone', '+351 123 456 789', 'string', 'Telefone de suporte', true),
('monetization', 'contact_view_cost', '1', 'number', 'Créditos necessários para ver contacto', false),
('monetization', 'platform_commission', '0.05', 'number', 'Comissão da plataforma (5%)', false),
('features', 'auto_approve_gigs', 'false', 'boolean', 'Aprovação automática de gigs', false),
('features', 'enable_sms_notifications', 'false', 'boolean', 'Ativar notificações SMS', false),
('moderation', 'auto_detect_sensitive_info', 'true', 'boolean', 'Deteção automática de info sensível', false);

COMMIT;

-- Mensagem de sucesso
SELECT 'Tabelas do Sistema Avançado de Administração criadas com sucesso!' as status;

-- BISKATE - FASE 2: SISTEMAS AVANÇADOS
-- Script completo para implementar todos os sistemas avançados

BEGIN;

-- =====================================================
-- 1. SISTEMA DE PAGAMENTOS COMPLETO
-- =====================================================

-- Configurações de pagamento por categoria
CREATE TABLE IF NOT EXISTS payment_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    platform_fee_percentage DECIMAL(5,2) DEFAULT 5.0,
    payment_fee_percentage DECIMAL(5,2) DEFAULT 2.9,
    payment_fee_fixed DECIMAL(10,2) DEFAULT 0.30,
    minimum_payout DECIMAL(10,2) DEFAULT 10.00,
    payout_schedule VARCHAR(20) DEFAULT 'weekly',
    auto_release_days INTEGER DEFAULT 7,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
    payer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    payee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    payment_fee DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed')),
    payment_method VARCHAR(50),
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    escrow_released_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de faturas
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    issued_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de transações (auditoria)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('payment', 'refund', 'fee', 'payout', 'chargeback')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    reference_id VARCHAR(255),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. SISTEMA DE CHAT AVANÇADO
-- =====================================================

-- Conversas
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(gig_id, client_id, provider_id)
);

-- Mensagens
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    file_url TEXT,
    file_name VARCHAR(255),
    file_size INTEGER,
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    edited_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. SISTEMA DE NOTIFICAÇÕES ROBUSTO
-- =====================================================

-- Preferências de notificação
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    frequency VARCHAR(20) DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'hourly', 'daily', 'weekly')),
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category)
);

-- Notificações melhoradas
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    action_label VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. SISTEMA DE AVALIAÇÕES MELHORADO
-- =====================================================

-- Categorias de avaliação
CREATE TABLE IF NOT EXISTS review_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    weight DECIMAL(3,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Avaliações melhoradas
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    category_ratings JSONB DEFAULT '{}',
    title VARCHAR(255),
    comment TEXT,
    pros TEXT,
    cons TEXT,
    would_recommend BOOLEAN,
    is_verified BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    response TEXT,
    response_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(gig_id, reviewer_id)
);

-- =====================================================
-- 5. SISTEMA DE MODERAÇÃO
-- =====================================================

-- Relatórios de conteúdo
CREATE TABLE IF NOT EXISTS content_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('gig', 'profile', 'review', 'message')),
    content_id UUID NOT NULL,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    moderator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    moderator_notes TEXT,
    action_taken VARCHAR(100),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. SISTEMA DE ANALYTICS
-- =====================================================

-- Métricas de usuário
CREATE TABLE IF NOT EXISTS user_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    gigs_created INTEGER DEFAULT 0,
    gigs_completed INTEGER DEFAULT 0,
    total_earned DECIMAL(10,2) DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    reviews_received INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    response_time_hours DECIMAL(8,2),
    completion_rate DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Métricas de gigs
CREATE TABLE IF NOT EXISTS gig_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    views INTEGER DEFAULT 0,
    applications INTEGER DEFAULT 0,
    messages INTEGER DEFAULT 0,
    bookmarks INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(gig_id, date)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices de pagamentos
CREATE INDEX IF NOT EXISTS idx_payments_gig_id ON payments(gig_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer_id ON payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_payments_payee_id ON payments(payee_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Índices de chat
CREATE INDEX IF NOT EXISTS idx_conversations_gig_id ON conversations(gig_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_provider_id ON conversations(provider_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Índices de notificações
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Índices de avaliações
CREATE INDEX IF NOT EXISTS idx_reviews_gig_id ON reviews(gig_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_overall_rating ON reviews(overall_rating);

-- =====================================================
-- TRIGGERS AUTOMÁTICOS
-- =====================================================

-- Trigger para atualizar última mensagem na conversa
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- Trigger para calcular valores de pagamento
CREATE OR REPLACE FUNCTION calculate_payment_amounts()
RETURNS TRIGGER AS $$
DECLARE
    category_settings RECORD;
BEGIN
    -- Buscar configurações da categoria
    SELECT ps.* INTO category_settings
    FROM payment_settings ps
    JOIN gigs g ON g.category = (SELECT name FROM categories WHERE id = ps.category_id)
    WHERE g.id = NEW.gig_id
    LIMIT 1;
    
    -- Se não encontrar configurações específicas, usar padrão
    IF category_settings IS NULL THEN
        NEW.platform_fee := NEW.amount * 0.05; -- 5% padrão
        NEW.payment_fee := NEW.amount * 0.029 + 0.30; -- 2.9% + €0.30
    ELSE
        NEW.platform_fee := NEW.amount * (category_settings.platform_fee_percentage / 100);
        NEW.payment_fee := NEW.amount * (category_settings.payment_fee_percentage / 100) + category_settings.payment_fee_fixed;
    END IF;
    
    NEW.net_amount := NEW.amount - NEW.platform_fee - NEW.payment_fee;
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_payment_amounts ON payments;
CREATE TRIGGER trigger_calculate_payment_amounts
    BEFORE INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION calculate_payment_amounts();

-- Trigger para gerar número de fatura
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL THEN
        NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('invoice_sequence')::TEXT, 6, '0');
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar sequência para faturas
CREATE SEQUENCE IF NOT EXISTS invoice_sequence START 1;

DROP TRIGGER IF EXISTS trigger_generate_invoice_number ON invoices;
CREATE TRIGGER trigger_generate_invoice_number
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION generate_invoice_number();

-- =====================================================
-- FUNÇÕES UTILITÁRIAS
-- =====================================================

-- Função para atualizar métricas de usuário
CREATE OR REPLACE FUNCTION update_user_metrics(user_uuid UUID, metric_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
    metrics RECORD;
BEGIN
    -- Calcular métricas
    SELECT 
        COUNT(CASE WHEN g.created_at::DATE = metric_date THEN 1 END) as gigs_created,
        COUNT(CASE WHEN g.status = 'completed' AND g.updated_at::DATE = metric_date THEN 1 END) as gigs_completed,
        COALESCE(SUM(CASE WHEN p.status = 'completed' AND p.payee_id = user_uuid AND p.created_at::DATE = metric_date THEN p.net_amount END), 0) as total_earned,
        COALESCE(SUM(CASE WHEN p.status = 'completed' AND p.payer_id = user_uuid AND p.created_at::DATE = metric_date THEN p.amount END), 0) as total_spent,
        COUNT(CASE WHEN r.created_at::DATE = metric_date AND r.reviewee_id = user_uuid THEN 1 END) as reviews_received,
        AVG(CASE WHEN r.reviewee_id = user_uuid THEN r.overall_rating END) as average_rating
    INTO metrics
    FROM profiles pr
    LEFT JOIN gigs g ON g.user_id = pr.id
    LEFT JOIN payments p ON p.payer_id = pr.id OR p.payee_id = pr.id
    LEFT JOIN reviews r ON r.reviewee_id = pr.id
    WHERE pr.id = user_uuid;
    
    -- Inserir ou atualizar métricas
    INSERT INTO user_metrics (user_id, date, gigs_created, gigs_completed, total_earned, total_spent, reviews_received, average_rating)
    VALUES (user_uuid, metric_date, metrics.gigs_created, metrics.gigs_completed, metrics.total_earned, metrics.total_spent, metrics.reviews_received, metrics.average_rating)
    ON CONFLICT (user_id, date) 
    DO UPDATE SET
        gigs_created = EXCLUDED.gigs_created,
        gigs_completed = EXCLUDED.gigs_completed,
        total_earned = EXCLUDED.total_earned,
        total_spent = EXCLUDED.total_spent,
        reviews_received = EXCLUDED.reviews_received,
        average_rating = EXCLUDED.average_rating;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

-- RLS para payment_settings
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_settings_admin_all" ON payment_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "payment_settings_public_read" ON payment_settings FOR SELECT USING (true);

-- RLS para payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_own_access" ON payments FOR ALL USING (
    payer_id = auth.uid() OR payee_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- RLS para conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_participants_access" ON conversations FOR ALL USING (
    client_id = auth.uid() OR provider_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- RLS para messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_conversation_access" ON messages FOR ALL USING (
    EXISTS (
        SELECT 1 FROM conversations c 
        WHERE c.id = conversation_id 
        AND (c.client_id = auth.uid() OR c.provider_id = auth.uid())
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- RLS para notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_preferences_own_access" ON notification_preferences FOR ALL USING (user_id = auth.uid());

-- RLS para reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_own_write" ON reviews FOR INSERT USING (reviewer_id = auth.uid());
CREATE POLICY "reviews_own_update" ON reviews FOR UPDATE USING (
    reviewer_id = auth.uid() OR reviewee_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- RLS para content_reports
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_reports_reporter_access" ON content_reports FOR INSERT USING (reporter_id = auth.uid());
CREATE POLICY "content_reports_admin_access" ON content_reports FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- RLS para user_metrics
ALTER TABLE user_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_metrics_own_read" ON user_metrics FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir configurações padrão de pagamento
INSERT INTO payment_settings (category_id, platform_fee_percentage, payment_fee_percentage, payment_fee_fixed)
SELECT 
    id,
    CASE 
        WHEN name ILIKE '%tecnologia%' THEN 8.0
        WHEN name ILIKE '%limpeza%' THEN 5.0
        WHEN name ILIKE '%reparacoes%' THEN 6.0
        ELSE 5.0
    END,
    2.9,
    0.30
FROM categories
ON CONFLICT DO NOTHING;

-- Inserir categorias de avaliação
INSERT INTO review_categories (name, description, weight) VALUES
('Qualidade', 'Qualidade do trabalho realizado', 1.5),
('Pontualidade', 'Cumprimento de prazos', 1.2),
('Comunicação', 'Clareza e rapidez na comunicação', 1.0),
('Profissionalismo', 'Atitude profissional', 1.1),
('Valor', 'Relação qualidade-preço', 0.9)
ON CONFLICT DO NOTHING;

-- Inserir preferências padrão de notificação
INSERT INTO notification_preferences (user_id, category, email_enabled, push_enabled)
SELECT 
    id,
    unnest(ARRAY['gigs', 'messages', 'payments', 'reviews', 'system']),
    true,
    true
FROM profiles
ON CONFLICT (user_id, category) DO NOTHING;

COMMIT;

-- Verificação final
SELECT 
    'payment_settings' as tabela, COUNT(*) as registros FROM payment_settings
UNION ALL
SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'notification_preferences', COUNT(*) FROM notification_preferences
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'review_categories', COUNT(*) FROM review_categories
UNION ALL
SELECT 'content_reports', COUNT(*) FROM content_reports
UNION ALL
SELECT 'user_metrics', COUNT(*) FROM user_metrics;

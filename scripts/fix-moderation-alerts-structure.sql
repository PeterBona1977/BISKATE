-- =====================================================
-- CORREÇÃO CRÍTICA: Estrutura da tabela moderation_alerts
-- Resolve o erro de relacionamento com content_id
-- =====================================================

-- 1. Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'moderation_alerts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Corrigir a estrutura da tabela moderation_alerts
-- Remover constraint problemática se existir
ALTER TABLE moderation_alerts DROP CONSTRAINT IF EXISTS moderation_alerts_content_id_fkey;

-- 3. Recriar a tabela com estrutura correta
CREATE TABLE IF NOT EXISTS moderation_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL, -- 'gig', 'gig_response', 'message'
    content_id UUID NOT NULL, -- ID do conteúdo (gig ou response)
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'ignored'
    reported_by UUID REFERENCES profiles(id),
    reviewed_by UUID REFERENCES profiles(id),
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_moderation_alerts_status ON moderation_alerts(status);
CREATE INDEX IF NOT EXISTS idx_moderation_alerts_type ON moderation_alerts(content_type);
CREATE INDEX IF NOT EXISTS idx_moderation_alerts_created ON moderation_alerts(created_at);

-- 5. Ativar RLS
ALTER TABLE moderation_alerts ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS
CREATE POLICY "moderation_alerts_admin_access" ON moderation_alerts
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 7. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_moderation_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_moderation_alerts_updated_at ON moderation_alerts;
CREATE TRIGGER update_moderation_alerts_updated_at
    BEFORE UPDATE ON moderation_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_moderation_alerts_updated_at();

-- 8. Inserir dados de teste para verificação
INSERT INTO moderation_alerts (
    content_type, 
    content_id, 
    alert_type,
    reported_by,
    reviewed_by,
    reason,
    notes,
    severity,
    status
) VALUES 
(
    'gig',
    (SELECT id FROM gigs LIMIT 1),
    'spam',
    (SELECT id FROM profiles WHERE role = 'user' LIMIT 1),
    NULL,
    'Contains spam content',
    'No further action needed',
    'high',
    'pending'
),
(
    'gig',
    (SELECT id FROM gigs LIMIT 1 OFFSET 1),
    'inappropriate_language',
    (SELECT id FROM profiles WHERE role = 'user' LIMIT 1),
    NULL,
    'Contains inappropriate language',
    'No further action needed',
    'medium',
    'pending'
);

-- 9. Verificar se os dados foram inseridos corretamente
SELECT 
    ma.*,
    g.title as gig_title,
    p.full_name as user_name
FROM moderation_alerts ma
LEFT JOIN gigs g ON ma.content_id = g.id AND ma.content_type = 'gig'
LEFT JOIN profiles p ON ma.reported_by = p.id
ORDER BY ma.created_at DESC;

-- Confirmar sucesso
SELECT 'Tabela moderation_alerts corrigida com sucesso!' as status;

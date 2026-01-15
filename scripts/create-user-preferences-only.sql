-- =====================================================
-- Script: Criar Tabela de Preferências de Notificação
-- Descrição: Cria tabela para preferências do usuário
-- =====================================================

BEGIN;

-- 1. Criar tabela de preferências de notificação
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Preferências de canal
    push_notifications BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    
    -- Preferências por tipo de evento
    gig_created BOOLEAN DEFAULT true,
    gig_approved BOOLEAN DEFAULT true,
    gig_rejected BOOLEAN DEFAULT true,
    response_received BOOLEAN DEFAULT true,
    response_accepted BOOLEAN DEFAULT true,
    contact_viewed BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir um registro por usuário
    UNIQUE(user_id)
);

-- 2. Habilitar RLS
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas existentes se houver conflito
DROP POLICY IF EXISTS "Users can view own preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Admins can view all preferences" ON user_notification_preferences;

-- 4. Criar políticas RLS
CREATE POLICY "Users can view own preferences"
    ON user_notification_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
    ON user_notification_preferences
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all preferences"
    ON user_notification_preferences
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 5. Adicionar colunas ao perfil (se não existirem)
DO $$
BEGIN
    -- Adicionar coluna bio
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'bio'
    ) THEN
        ALTER TABLE profiles ADD COLUMN bio TEXT;
    END IF;
    
    -- Adicionar coluna location
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'location'
    ) THEN
        ALTER TABLE profiles ADD COLUMN location VARCHAR(255);
    END IF;
    
    -- Adicionar coluna phone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'phone'
    ) THEN
        ALTER TABLE profiles ADD COLUMN phone VARCHAR(20);
    END IF;
END $$;

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id 
    ON user_notification_preferences(user_id);

-- 7. Criar função para trigger de novos usuários
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar trigger para novos usuários
DROP TRIGGER IF EXISTS trigger_create_notification_preferences ON profiles;
CREATE TRIGGER trigger_create_notification_preferences
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- 9. Criar preferências padrão para usuários existentes
INSERT INTO user_notification_preferences (user_id)
SELECT id FROM profiles
WHERE id NOT IN (SELECT user_id FROM user_notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- 10. Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Trigger para atualizar timestamp
DROP TRIGGER IF EXISTS trigger_update_notification_preferences_timestamp ON user_notification_preferences;
CREATE TRIGGER trigger_update_notification_preferences_timestamp
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_timestamp();

COMMIT;

-- =====================================================
-- Verificações e Relatório
-- =====================================================

-- Verificar se a tabela foi criada
SELECT 
    'user_notification_preferences' as tabela,
    COUNT(*) as total_colunas
FROM information_schema.columns 
WHERE table_name = 'user_notification_preferences';

-- Verificar preferências criadas
SELECT 
    'Preferências criadas' as status,
    COUNT(*) as total_usuarios
FROM user_notification_preferences;

-- Verificar novas colunas no perfil
SELECT 
    'Colunas adicionadas ao perfil' as status,
    COUNT(*) as total_colunas
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('bio', 'location', 'phone');

-- Verificar políticas RLS
SELECT 
    'Políticas RLS' as status,
    COUNT(*) as total_politicas
FROM pg_policies 
WHERE tablename = 'user_notification_preferences';

-- Mensagem de sucesso
SELECT '🎉 TABELA DE PREFERÊNCIAS CRIADA COM SUCESSO!' as resultado;

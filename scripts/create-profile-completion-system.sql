-- Sistema de Completude de Perfil para BISKATE
-- Cria tabelas, funções e triggers para incentivar perfis completos

-- 1. Adicionar campos de completude à tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS completion_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completion_percentage DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS last_completion_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS completion_reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completion_reminder_count INTEGER DEFAULT 0;

-- 2. Criar tabela para tracking detalhado de campos
CREATE TABLE IF NOT EXISTS profile_completion_fields (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    field_name VARCHAR(50) NOT NULL,
    field_category VARCHAR(30) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    points_value INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, field_name)
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profile_completion_fields_user_id ON profile_completion_fields(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_completion_fields_category ON profile_completion_fields(field_category);
CREATE INDEX IF NOT EXISTS idx_profiles_completion_score ON profiles(completion_score);
CREATE INDEX IF NOT EXISTS idx_profiles_completion_percentage ON profiles(completion_percentage);

-- 4. Função para calcular completude do perfil
CREATE OR REPLACE FUNCTION calculate_profile_completion(user_uuid UUID)
RETURNS TABLE(
    total_score INTEGER,
    percentage DECIMAL(5,2),
    completed_fields JSONB,
    missing_fields JSONB
) AS $$
DECLARE
    profile_record RECORD;
    provider_record RECORD;
    total_possible_points INTEGER := 100;
    current_score INTEGER := 0;
    completed_list JSONB := '[]'::jsonb;
    missing_list JSONB := '[]'::jsonb;
BEGIN
    -- Buscar dados do perfil
    SELECT * INTO profile_record FROM profiles WHERE user_id = user_uuid;
    SELECT * INTO provider_record FROM provider_profiles WHERE user_id = user_uuid;
    
    -- Verificar campos básicos (60 pontos total)
    IF profile_record.full_name IS NOT NULL AND LENGTH(TRIM(profile_record.full_name)) > 0 THEN
        current_score := current_score + 15;
        completed_list := completed_list || jsonb_build_object('field', 'full_name', 'points', 15, 'category', 'basic');
    ELSE
        missing_list := missing_list || jsonb_build_object('field', 'full_name', 'points', 15, 'category', 'basic', 'description', 'Nome completo');
    END IF;
    
    IF profile_record.avatar_url IS NOT NULL AND LENGTH(TRIM(profile_record.avatar_url)) > 0 THEN
        current_score := current_score + 20;
        completed_list := completed_list || jsonb_build_object('field', 'avatar_url', 'points', 20, 'category', 'basic');
    ELSE
        missing_list := missing_list || jsonb_build_object('field', 'avatar_url', 'points', 20, 'category', 'basic', 'description', 'Foto de perfil');
    END IF;
    
    IF profile_record.bio IS NOT NULL AND LENGTH(TRIM(profile_record.bio)) > 20 THEN
        current_score := current_score + 15;
        completed_list := completed_list || jsonb_build_object('field', 'bio', 'points', 15, 'category', 'basic');
    ELSE
        missing_list := missing_list || jsonb_build_object('field', 'bio', 'points', 15, 'category', 'basic', 'description', 'Biografia (mín. 20 caracteres)');
    END IF;
    
    IF profile_record.location IS NOT NULL AND LENGTH(TRIM(profile_record.location)) > 0 THEN
        current_score := current_score + 10;
        completed_list := completed_list || jsonb_build_object('field', 'location', 'points', 10, 'category', 'basic');
    ELSE
        missing_list := missing_list || jsonb_build_object('field', 'location', 'points', 10, 'category', 'basic', 'description', 'Localização');
    END IF;
    
    -- Verificar campos de provider (40 pontos total)
    IF provider_record IS NOT NULL THEN
        IF provider_record.skills IS NOT NULL AND jsonb_array_length(provider_record.skills) > 0 THEN
            current_score := current_score + 15;
            completed_list := completed_list || jsonb_build_object('field', 'skills', 'points', 15, 'category', 'provider');
        ELSE
            missing_list := missing_list || jsonb_build_object('field', 'skills', 'points', 15, 'category', 'provider', 'description', 'Competências/Skills');
        END IF;
        
        IF provider_record.hourly_rate IS NOT NULL AND provider_record.hourly_rate > 0 THEN
            current_score := current_score + 10;
            completed_list := completed_list || jsonb_build_object('field', 'hourly_rate', 'points', 10, 'category', 'provider');
        ELSE
            missing_list := missing_list || jsonb_build_object('field', 'hourly_rate', 'points', 10, 'category', 'provider', 'description', 'Taxa horária');
        END IF;
        
        IF provider_record.portfolio_items IS NOT NULL AND jsonb_array_length(provider_record.portfolio_items) > 0 THEN
            current_score := current_score + 15;
            completed_list := completed_list || jsonb_build_object('field', 'portfolio', 'points', 15, 'category', 'provider');
        ELSE
            missing_list := missing_list || jsonb_build_object('field', 'portfolio', 'points', 15, 'category', 'provider', 'description', 'Portfólio (pelo menos 1 item)');
        END IF;
    ELSE
        missing_list := missing_list || jsonb_build_object('field', 'skills', 'points', 15, 'category', 'provider', 'description', 'Competências/Skills');
        missing_list := missing_list || jsonb_build_object('field', 'hourly_rate', 'points', 10, 'category', 'provider', 'description', 'Taxa horária');
        missing_list := missing_list || jsonb_build_object('field', 'portfolio', 'points', 15, 'category', 'provider', 'description', 'Portfólio');
    END IF;
    
    RETURN QUERY SELECT 
        current_score,
        ROUND((current_score::DECIMAL / total_possible_points::DECIMAL) * 100, 2),
        completed_list,
        missing_list;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Função para atualizar completude do perfil
CREATE OR REPLACE FUNCTION update_profile_completion(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    completion_data RECORD;
BEGIN
    -- Calcular completude
    SELECT * INTO completion_data FROM calculate_profile_completion(user_uuid);
    
    -- Atualizar tabela profiles
    UPDATE profiles 
    SET 
        completion_score = completion_data.total_score,
        completion_percentage = completion_data.percentage,
        last_completion_check = NOW(),
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    -- Limpar registros antigos de campos
    DELETE FROM profile_completion_fields WHERE user_id = user_uuid;
    
    -- Inserir campos completados
    INSERT INTO profile_completion_fields (user_id, field_name, field_category, is_completed, points_value, completed_at)
    SELECT 
        user_uuid,
        field->>'field',
        field->>'category',
        TRUE,
        (field->>'points')::INTEGER,
        NOW()
    FROM jsonb_array_elements(completion_data.completed_fields) AS field;
    
    -- Inserir campos em falta
    INSERT INTO profile_completion_fields (user_id, field_name, field_category, is_completed, points_value)
    SELECT 
        user_uuid,
        field->>'field',
        field->>'category',
        FALSE,
        (field->>'points')::INTEGER
    FROM jsonb_array_elements(completion_data.missing_fields) AS field;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger para atualizar completude automaticamente
CREATE OR REPLACE FUNCTION trigger_update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar completude após mudanças no perfil
    PERFORM update_profile_completion(COALESCE(NEW.user_id, OLD.user_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Criar triggers
DROP TRIGGER IF EXISTS profiles_completion_trigger ON profiles;
CREATE TRIGGER profiles_completion_trigger
    AFTER INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_profile_completion();

DROP TRIGGER IF EXISTS provider_profiles_completion_trigger ON provider_profiles;
CREATE TRIGGER provider_profiles_completion_trigger
    AFTER INSERT OR UPDATE OR DELETE ON provider_profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_profile_completion();

-- 7. Configurar RLS (Row Level Security)
ALTER TABLE profile_completion_fields ENABLE ROW LEVEL SECURITY;

-- Política para utilizadores verem apenas os seus próprios dados
CREATE POLICY "Users can view own completion fields" ON profile_completion_fields
    FOR SELECT USING (auth.uid() = user_id);

-- Política para admins verem todos os dados
CREATE POLICY "Admins can view all completion fields" ON profile_completion_fields
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Sucesso!
SELECT 'Sistema de Completude de Perfil criado com sucesso! 🎉' as status;

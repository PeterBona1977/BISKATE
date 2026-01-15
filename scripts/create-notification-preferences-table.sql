-- Criar tabela para preferências de notificação dos usuários
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Canais de notificação
  push_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  
  -- Tipos de notificação
  gig_created BOOLEAN DEFAULT true,
  gig_approved BOOLEAN DEFAULT true,
  gig_rejected BOOLEAN DEFAULT true,
  response_received BOOLEAN DEFAULT true,
  response_accepted BOOLEAN DEFAULT true,
  contact_viewed BOOLEAN DEFAULT true,
  
  -- Marketing
  marketing_emails BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para garantir um registro por usuário
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias preferências
CREATE POLICY "users_can_view_own_notification_preferences"
  ON user_notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para usuários editarem apenas suas próprias preferências
CREATE POLICY "users_can_update_own_notification_preferences"
  ON user_notification_preferences
  FOR ALL
  USING (auth.uid() = user_id);

-- Política para admins verem todas as preferências
CREATE POLICY "admins_can_view_all_notification_preferences"
  ON user_notification_preferences
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Adicionar campos ao perfil se não existirem
DO $$ 
BEGIN
  -- Adicionar campo bio se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio TEXT;
  END IF;
  
  -- Adicionar campo location se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'location'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location VARCHAR(255);
  END IF;
  
  -- Adicionar campo phone se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone VARCHAR(20);
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id 
ON user_notification_preferences(user_id);

-- Função para criar preferências padrão para novos usuários
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar preferências padrão quando um novo perfil é criado
DROP TRIGGER IF EXISTS create_default_notification_preferences_trigger ON profiles;
CREATE TRIGGER create_default_notification_preferences_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Criar preferências padrão para usuários existentes
INSERT INTO user_notification_preferences (user_id)
SELECT id FROM profiles
ON CONFLICT (user_id) DO NOTHING;

RAISE NOTICE '✅ Tabela de preferências de notificação criada com sucesso!';
RAISE NOTICE '✅ Preferências padrão criadas para usuários existentes!';
RAISE NOTICE '✅ Trigger configurado para novos usuários!';

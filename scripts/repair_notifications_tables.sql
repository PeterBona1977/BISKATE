-- ========================================
-- SCRIPT: REPAIR MISSING NOTIFICATION TABLES
-- Descrição: Recria tabelas user_device_tokens e user_notification_preferences se estiverem faltando
-- ========================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA user_device_tokens
CREATE TABLE IF NOT EXISTS public.user_device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_info JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, token)
);

COMMENT ON TABLE public.user_device_tokens IS 'Armazena tokens de dispositivo para envio de notificações push via Firebase Cloud Messaging';

-- 3. TABELA user_notification_preferences
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
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
  
  UNIQUE(user_id)
);

-- 4. RLS: user_device_tokens
ALTER TABLE public.user_device_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_device_tokens_insert_own" ON public.user_device_tokens;
CREATE POLICY "user_device_tokens_insert_own" ON public.user_device_tokens FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_device_tokens_select_own" ON public.user_device_tokens;
CREATE POLICY "user_device_tokens_select_own" ON public.user_device_tokens FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_device_tokens_update_own" ON public.user_device_tokens;
CREATE POLICY "user_device_tokens_update_own" ON public.user_device_tokens FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_device_tokens_delete_own" ON public.user_device_tokens;
CREATE POLICY "user_device_tokens_delete_own" ON public.user_device_tokens FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_device_tokens_admin_all" ON public.user_device_tokens;
CREATE POLICY "user_device_tokens_admin_all" ON public.user_device_tokens FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 5. RLS: user_notification_preferences
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_can_view_own_notification_preferences" ON public.user_notification_preferences;
CREATE POLICY "users_can_view_own_notification_preferences" ON public.user_notification_preferences FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_can_update_own_notification_preferences" ON public.user_notification_preferences;
CREATE POLICY "users_can_update_own_notification_preferences" ON public.user_notification_preferences FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admins_can_view_all_notification_preferences" ON public.user_notification_preferences;
CREATE POLICY "admins_can_view_all_notification_preferences" ON public.user_notification_preferences FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 6. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_user_device_tokens_user_id ON public.user_device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_device_tokens_token ON public.user_device_tokens(token);
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);

-- 7. TRIGGERS & FUNCTIONS
-- Função para limpar tokens expirados
CREATE OR REPLACE FUNCTION clean_expired_device_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_device_tokens
  WHERE last_used_at < (now() - INTERVAL '30 days') OR is_active = false;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar preferências padrão
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_notification_preferences (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_default_notification_preferences_trigger ON profiles;
CREATE TRIGGER create_default_notification_preferences_trigger AFTER INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();

-- 8. PREENCHER DADOS INICIAIS
INSERT INTO user_notification_preferences (user_id)
SELECT id FROM profiles
ON CONFLICT (user_id) DO NOTHING;

-- 9. TABELA COMPLEMENTAR: platform_integrations (se não existir)
CREATE TABLE IF NOT EXISTS public.platform_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id),
  UNIQUE (service_name)
);

ALTER TABLE public.platform_integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "platform_integrations_admin_all" ON public.platform_integrations;
CREATE POLICY "platform_integrations_admin_all" ON public.platform_integrations FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- VERIFICAÇÃO FINAL
DO $$
DECLARE
  tokens_exists BOOLEAN;
  prefs_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_device_tokens') INTO tokens_exists;
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_notification_preferences') INTO prefs_exists;
  
  IF tokens_exists AND prefs_exists THEN
    RAISE NOTICE '✅ SUCESSO: Tabelas recriadas e configuradas corretamente.';
  ELSE
    RAISE NOTICE '❌ ERRO: Alguma tabela ainda está faltando.';
  END IF;
END $$;

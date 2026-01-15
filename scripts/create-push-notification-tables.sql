-- ========================================
-- SCRIPT: Criação de Tabelas para Push Notifications
-- Descrição: Cria tabelas para armazenar tokens de dispositivo e configurações do Firebase
-- ========================================

-- Verificar se a extensão uuid-ossp está disponível
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- TABELA: user_device_tokens
-- Descrição: Armazena tokens FCM dos dispositivos dos utilizadores
-- ========================================

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

-- Adicionar comentários para documentação
COMMENT ON TABLE public.user_device_tokens IS 'Armazena tokens de dispositivo para envio de notificações push via Firebase Cloud Messaging';
COMMENT ON COLUMN public.user_device_tokens.user_id IS 'ID do utilizador associado ao token';
COMMENT ON COLUMN public.user_device_tokens.token IS 'Token FCM do dispositivo/navegador';
COMMENT ON COLUMN public.user_device_tokens.device_info IS 'Informações sobre o dispositivo (navegador, sistema operacional, etc.)';
COMMENT ON COLUMN public.user_device_tokens.is_active IS 'Indica se o token está ativo e válido';
COMMENT ON COLUMN public.user_device_tokens.last_used_at IS 'Última vez que o token foi usado com sucesso';

-- ========================================
-- TABELA: platform_integrations
-- Descrição: Armazena configurações de integrações externas (Firebase, etc.)
-- ========================================

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

-- Adicionar comentários para documentação
COMMENT ON TABLE public.platform_integrations IS 'Armazena configurações de integrações externas como Firebase, Twilio, etc.';
COMMENT ON COLUMN public.platform_integrations.service_name IS 'Nome do serviço (ex: firebase, twilio, stripe)';
COMMENT ON COLUMN public.platform_integrations.config IS 'Configurações do serviço em formato JSON';
COMMENT ON COLUMN public.platform_integrations.is_enabled IS 'Indica se a integração está ativa';
COMMENT ON COLUMN public.platform_integrations.created_by IS 'Admin que criou a configuração';
COMMENT ON COLUMN public.platform_integrations.updated_by IS 'Admin que fez a última atualização';

-- ========================================
-- CONFIGURAR ROW LEVEL SECURITY (RLS)
-- ========================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.user_device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_integrations ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS RLS: user_device_tokens
-- ========================================

-- Política para inserir tokens (utilizadores podem inserir seus próprios tokens)
DROP POLICY IF EXISTS "user_device_tokens_insert_own" ON public.user_device_tokens;
CREATE POLICY "user_device_tokens_insert_own" 
  ON public.user_device_tokens 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Política para visualizar tokens (utilizadores só veem seus próprios tokens)
DROP POLICY IF EXISTS "user_device_tokens_select_own" ON public.user_device_tokens;
CREATE POLICY "user_device_tokens_select_own" 
  ON public.user_device_tokens 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Política para atualizar tokens (utilizadores podem atualizar seus próprios tokens)
DROP POLICY IF EXISTS "user_device_tokens_update_own" ON public.user_device_tokens;
CREATE POLICY "user_device_tokens_update_own" 
  ON public.user_device_tokens 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Política para deletar tokens (utilizadores podem deletar seus próprios tokens)
DROP POLICY IF EXISTS "user_device_tokens_delete_own" ON public.user_device_tokens;
CREATE POLICY "user_device_tokens_delete_own" 
  ON public.user_device_tokens 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Política para admins visualizarem todos os tokens (para gestão)
DROP POLICY IF EXISTS "user_device_tokens_admin_all" ON public.user_device_tokens;
CREATE POLICY "user_device_tokens_admin_all" 
  ON public.user_device_tokens 
  FOR ALL 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- ========================================
-- POLÍTICAS RLS: platform_integrations
-- ========================================

-- Política para admins (apenas admins podem gerir integrações)
DROP POLICY IF EXISTS "platform_integrations_admin_all" ON public.platform_integrations;
CREATE POLICY "platform_integrations_admin_all" 
  ON public.platform_integrations 
  FOR ALL 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- ========================================
-- ÍNDICES PARA MELHORAR PERFORMANCE
-- ========================================

-- Índices para user_device_tokens
CREATE INDEX IF NOT EXISTS idx_user_device_tokens_user_id ON public.user_device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_device_tokens_token ON public.user_device_tokens(token);
CREATE INDEX IF NOT EXISTS idx_user_device_tokens_active ON public.user_device_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_user_device_tokens_last_used ON public.user_device_tokens(last_used_at);

-- Índices para platform_integrations
CREATE INDEX IF NOT EXISTS idx_platform_integrations_service_name ON public.platform_integrations(service_name);
CREATE INDEX IF NOT EXISTS idx_platform_integrations_enabled ON public.platform_integrations(is_enabled);

-- ========================================
-- INSERIR CONFIGURAÇÃO INICIAL DO FIREBASE
-- ========================================

-- Inserir configuração vazia do Firebase para ser preenchida pelo admin
INSERT INTO public.platform_integrations (service_name, config, is_enabled, created_at)
VALUES (
  'firebase',
  '{
    "apiKey": "",
    "authDomain": "",
    "projectId": "",
    "storageBucket": "",
    "messagingSenderId": "",
    "appId": "",
    "serverKey": "",
    "vapidKey": ""
  }',
  false,
  now()
)
ON CONFLICT (service_name) DO NOTHING;

-- Inserir placeholder para SMS (Twilio) - para uso futuro
INSERT INTO public.platform_integrations (service_name, config, is_enabled, created_at)
VALUES (
  'twilio',
  '{
    "accountSid": "",
    "authToken": "",
    "fromNumber": ""
  }',
  false,
  now()
)
ON CONFLICT (service_name) DO NOTHING;

-- ========================================
-- FUNÇÕES AUXILIARES
-- ========================================

-- Função para limpar tokens expirados/inativos
CREATE OR REPLACE FUNCTION clean_expired_device_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Deletar tokens que não foram usados há mais de 30 dias
  DELETE FROM public.user_device_tokens
  WHERE last_used_at < (now() - INTERVAL '30 days')
     OR is_active = false;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função
COMMENT ON FUNCTION clean_expired_device_tokens() IS 'Remove tokens de dispositivo expirados ou inativos (mais de 30 dias sem uso)';

-- ========================================
-- VERIFICAÇÃO FINAL E RELATÓRIO
-- ========================================

-- Verificar se as tabelas foram criadas com sucesso
DO $$
DECLARE
  tokens_table_exists BOOLEAN;
  integrations_table_exists BOOLEAN;
  firebase_config_exists BOOLEAN;
BEGIN
  -- Verificar existência das tabelas
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_device_tokens'
  ) INTO tokens_table_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'platform_integrations'
  ) INTO integrations_table_exists;
  
  -- Verificar se a configuração do Firebase foi inserida
  SELECT EXISTS (
    SELECT FROM public.platform_integrations 
    WHERE service_name = 'firebase'
  ) INTO firebase_config_exists;
  
  -- Exibir relatório
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RELATÓRIO DE CRIAÇÃO DE TABELAS';
  RAISE NOTICE '========================================';
  
  IF tokens_table_exists THEN
    RAISE NOTICE '✅ Tabela user_device_tokens criada com sucesso';
  ELSE
    RAISE NOTICE '❌ Erro ao criar tabela user_device_tokens';
  END IF;
  
  IF integrations_table_exists THEN
    RAISE NOTICE '✅ Tabela platform_integrations criada com sucesso';
  ELSE
    RAISE NOTICE '❌ Erro ao criar tabela platform_integrations';
  END IF;
  
  IF firebase_config_exists THEN
    RAISE NOTICE '✅ Configuração inicial do Firebase inserida';
  ELSE
    RAISE NOTICE '❌ Erro ao inserir configuração do Firebase';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Configure o Firebase Console';
  RAISE NOTICE '2. Acesse /admin/settings/integrations';
  RAISE NOTICE '3. Insira as credenciais do Firebase';
  RAISE NOTICE '4. Ative o serviço de Push Notifications';
  RAISE NOTICE '========================================';
END $$;

-- Exibir mensagem final de sucesso
SELECT '🎉 TABELAS PARA PUSH NOTIFICATIONS CRIADAS COM SUCESSO!' as message,
       'Próximo passo: Configurar Firebase Console e credenciais' as next_step;

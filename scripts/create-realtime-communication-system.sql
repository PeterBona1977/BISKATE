-- Expandir sistema de conversas para tempo real
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS unread_count_client INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unread_count_provider INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS typing_user_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS typing_started_at TIMESTAMP WITH TIME ZONE;

-- Expandir mensagens para tempo real
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id),
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}';

-- Criar tabela de status online dos usuários
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  device_info JSONB,
  
  -- Localização atual (opcional)
  current_page TEXT,
  session_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Criar tabela de notificações push em tempo real
CREATE TABLE IF NOT EXISTS realtime_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'new_message', 'new_proposal', 'proposal_accepted', 'proposal_rejected',
    'gig_approved', 'gig_completed', 'payment_received', 'review_received',
    'system_alert', 'promotion'
  )),
  
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- Dados da notificação
  data JSONB,
  action_url TEXT,
  
  -- Configurações de entrega
  channels TEXT[] DEFAULT ARRAY['app'], -- app, push, email, sms
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Status de entrega
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  
  -- Agendamento
  scheduled_for TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de sessões ativas
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  
  -- Informações da sessão
  device_type TEXT,
  browser TEXT,
  os TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Localização
  country TEXT,
  city TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Criar tabela de eventos de tempo real
CREATE TABLE IF NOT EXISTS realtime_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL, -- conversation_id, user_id, etc
  payload JSONB NOT NULL,
  
  -- Metadados
  sender_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_events ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para presença
CREATE POLICY "Usuários podem ver presença de outros" ON user_presence
  FOR SELECT USING (true); -- Presença é pública

CREATE POLICY "Usuários podem atualizar sua presença" ON user_presence
  FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Políticas RLS para notificações
CREATE POLICY "Usuários podem ver suas notificações" ON realtime_notifications
  FOR SELECT USING (
    auth.role() = 'authenticated' AND user_id = auth.uid()
  );

CREATE POLICY "Sistema pode criar notificações" ON realtime_notifications
  FOR INSERT WITH CHECK (true); -- Sistema pode criar para qualquer usuário

-- Políticas RLS para sessões
CREATE POLICY "Usuários podem ver suas sessões" ON active_sessions
  FOR SELECT USING (
    auth.role() = 'authenticated' AND user_id = auth.uid()
  );

CREATE POLICY "Usuários podem gerenciar suas sessões" ON active_sessions
  FOR ALL USING (
    auth.role() = 'authenticated' AND user_id = auth.uid()
  );

-- Políticas RLS para eventos
CREATE POLICY "Sistema pode gerenciar eventos" ON realtime_events
  FOR ALL USING (true); -- Sistema interno

-- Função para atualizar presença do usuário
CREATE OR REPLACE FUNCTION update_user_presence(
  target_user_id UUID,
  new_status TEXT DEFAULT 'online',
  page_info TEXT DEFAULT NULL,
  device_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_presence (
    user_id, status, last_seen, current_page, device_info, updated_at
  ) VALUES (
    target_user_id, new_status, NOW(), page_info, device_data, NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    status = EXCLUDED.status,
    last_seen = NOW(),
    current_page = EXCLUDED.current_page,
    device_info = EXCLUDED.device_info,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Função para marcar mensagem como lida
CREATE OR REPLACE FUNCTION mark_message_as_read(
  message_id UUID,
  reader_user_id UUID
)
RETURNS VOID AS $$
DECLARE
  conversation_record RECORD;
BEGIN
  -- Marcar mensagem como lida
  UPDATE messages 
  SET read_at = NOW(), is_read = TRUE 
  WHERE id = message_id;
  
  -- Buscar conversa e atualizar contador
  SELECT * INTO conversation_record 
  FROM conversations c
  JOIN messages m ON m.conversation_id = c.id
  WHERE m.id = message_id;
  
  IF conversation_record IS NOT NULL THEN
    -- Atualizar contador baseado no tipo de usuário
    IF conversation_record.client_id = reader_user_id THEN
      UPDATE conversations 
      SET unread_count_client = GREATEST(0, unread_count_client - 1)
      WHERE id = conversation_record.id;
    ELSIF conversation_record.provider_id = reader_user_id THEN
      UPDATE conversations 
      SET unread_count_provider = GREATEST(0, unread_count_provider - 1)
      WHERE id = conversation_record.id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para enviar notificação em tempo real
CREATE OR REPLACE FUNCTION send_realtime_notification(
  target_user_id UUID,
  notification_type TEXT,
  notification_title TEXT,
  notification_body TEXT,
  notification_data JSONB DEFAULT '{}',
  notification_channels TEXT[] DEFAULT ARRAY['app'],
  notification_priority TEXT DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Criar notificação
  INSERT INTO realtime_notifications (
    user_id, type, title, body, data, channels, priority
  ) VALUES (
    target_user_id, notification_type, notification_title, 
    notification_body, notification_data, notification_channels, notification_priority
  ) RETURNING id INTO notification_id;
  
  -- Criar evento de tempo real
  INSERT INTO realtime_events (
    event_type, channel, payload
  ) VALUES (
    'notification_created',
    'user_' || target_user_id,
    jsonb_build_object(
      'notification_id', notification_id,
      'type', notification_type,
      'title', notification_title,
      'body', notification_body,
      'data', notification_data
    )
  );
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificar nova mensagem
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  conversation_record RECORD;
  recipient_id UUID;
  sender_name TEXT;
BEGIN
  -- Buscar dados da conversa
  SELECT c.*, 
         cp.full_name as provider_name,
         cc.full_name as client_name,
         g.title as gig_title
  INTO conversation_record
  FROM conversations c
  JOIN profiles cp ON cp.id = c.provider_id
  JOIN profiles cc ON cc.id = c.client_id
  JOIN gigs g ON g.id = c.gig_id
  WHERE c.id = NEW.conversation_id;
  
  -- Determinar destinatário
  IF NEW.sender_id = conversation_record.client_id THEN
    recipient_id := conversation_record.provider_id;
    sender_name := conversation_record.client_name;
  ELSE
    recipient_id := conversation_record.client_id;
    sender_name := conversation_record.provider_name;
  END IF;
  
  -- Atualizar contador de não lidas
  IF NEW.sender_id = conversation_record.client_id THEN
    UPDATE conversations 
    SET unread_count_provider = unread_count_provider + 1,
        last_message_at = NOW()
    WHERE id = NEW.conversation_id;
  ELSE
    UPDATE conversations 
    SET unread_count_client = unread_count_client + 1,
        last_message_at = NOW()
    WHERE id = NEW.conversation_id;
  END IF;
  
  -- Enviar notificação em tempo real
  PERFORM send_realtime_notification(
    recipient_id,
    'new_message',
    'Nova mensagem de ' || sender_name,
    LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END,
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'message_id', NEW.id,
      'sender_name', sender_name,
      'gig_title', conversation_record.gig_title
    ),
    ARRAY['app', 'push'],
    'normal'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Função para limpar sessões expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM active_sessions 
  WHERE expires_at < NOW() OR last_activity < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para marcar usuários offline após inatividade
CREATE OR REPLACE FUNCTION mark_inactive_users_offline()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE user_presence 
  SET status = 'offline', updated_at = NOW()
  WHERE status != 'offline' 
    AND last_seen < NOW() - INTERVAL '5 minutes';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen);

CREATE INDEX IF NOT EXISTS idx_realtime_notifications_user_id ON realtime_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_created_at ON realtime_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_type ON realtime_notifications(type);

CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_token ON active_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires_at ON active_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_realtime_events_channel ON realtime_events(channel);
CREATE INDEX IF NOT EXISTS idx_realtime_events_created_at ON realtime_events(created_at);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at);
CREATE INDEX IF NOT EXISTS idx_conversations_last_activity ON conversations(last_activity);

-- Expandir tabela gig_responses para propostas mais detalhadas
ALTER TABLE gig_responses 
ADD COLUMN IF NOT EXISTS proposal_title TEXT,
ADD COLUMN IF NOT EXISTS proposal_description TEXT,
ADD COLUMN IF NOT EXISTS deliverables JSONB,
ADD COLUMN IF NOT EXISTS timeline_days INTEGER,
ADD COLUMN IF NOT EXISTS terms_conditions TEXT,
ADD COLUMN IF NOT EXISTS attachments JSONB,
ADD COLUMN IF NOT EXISTS is_counter_proposal BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS parent_proposal_id UUID REFERENCES gig_responses(id),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Criar tabela de templates de propostas
CREATE TABLE IF NOT EXISTS proposal_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  deliverables JSONB,
  terms_conditions TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de conversas/chat
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(gig_id, client_id, provider_id)
);

-- Criar tabela de mensagens
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'proposal', 'system')),
  attachments JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de negociações
CREATE TABLE IF NOT EXISTS negotiations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_proposal_id UUID REFERENCES gig_responses(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'accepted', 'rejected', 'expired', 'cancelled')),
  final_price NUMERIC(10,2),
  final_timeline_days INTEGER,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para templates
CREATE POLICY "Prestadores podem gerenciar seus templates" ON proposal_templates
  FOR ALL USING (
    auth.role() = 'authenticated' AND (
      provider_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
  );

-- Políticas RLS para conversas
CREATE POLICY "Participantes podem ver conversas" ON conversations
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      client_id = auth.uid() OR 
      provider_id = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
  );

CREATE POLICY "Participantes podem criar conversas" ON conversations
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      client_id = auth.uid() OR provider_id = auth.uid()
    )
  );

-- Políticas RLS para mensagens
CREATE POLICY "Participantes podem ver mensagens" ON messages
  FOR SELECT USING (
    auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_id 
      AND (conversations.client_id = auth.uid() OR conversations.provider_id = auth.uid())
    )
  );

CREATE POLICY "Participantes podem enviar mensagens" ON messages
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND sender_id = auth.uid() AND EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_id 
      AND (conversations.client_id = auth.uid() OR conversations.provider_id = auth.uid())
    )
  );

-- Políticas RLS para negociações
CREATE POLICY "Participantes podem ver negociações" ON negotiations
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      client_id = auth.uid() OR 
      provider_id = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
  );

CREATE POLICY "Participantes podem gerenciar negociações" ON negotiations
  FOR ALL USING (
    auth.role() = 'authenticated' AND (
      client_id = auth.uid() OR provider_id = auth.uid()
    )
  );

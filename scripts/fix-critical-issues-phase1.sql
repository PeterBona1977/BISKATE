-- =====================================================
-- CORREÇÕES CRÍTICAS - FASE 1
-- Baseado no diagnóstico do sistema
-- =====================================================

-- 1. CORRIGIR POLÍTICAS RLS PROBLEMÁTICAS
-- Remover políticas que podem estar causando bloqueios

-- Profiles - Permitir leitura própria e admin
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
CREATE POLICY "profiles_select_policy" ON profiles
FOR SELECT USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Profiles - Permitir atualização própria e admin
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
CREATE POLICY "profiles_update_policy" ON profiles
FOR UPDATE USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Categories - Leitura pública, escrita apenas admin
DROP POLICY IF EXISTS "categories_select_policy" ON categories;
CREATE POLICY "categories_select_policy" ON categories
FOR SELECT USING (true);

DROP POLICY IF EXISTS "categories_insert_policy" ON categories;
CREATE POLICY "categories_insert_policy" ON categories
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "categories_update_policy" ON categories;
CREATE POLICY "categories_update_policy" ON categories
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Gigs - Leitura pública, escrita pelo dono ou admin
DROP POLICY IF EXISTS "gigs_select_policy" ON gigs;
CREATE POLICY "gigs_select_policy" ON gigs
FOR SELECT USING (
  status = 'published' OR 
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "gigs_insert_policy" ON gigs;
CREATE POLICY "gigs_insert_policy" ON gigs
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "gigs_update_policy" ON gigs;
CREATE POLICY "gigs_update_policy" ON gigs
FOR UPDATE USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- 2. CRIAR TABELAS EM FALTA

-- Tabela de propostas (se não existir)
CREATE TABLE IF NOT EXISTS proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  delivery_time INTEGER NOT NULL, -- em dias
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(gig_id, provider_id)
);

-- RLS para proposals
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposals_select_policy" ON proposals
FOR SELECT USING (
  provider_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM gigs g WHERE g.id = gig_id AND g.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

CREATE POLICY "proposals_insert_policy" ON proposals
FOR INSERT WITH CHECK (provider_id = auth.uid());

CREATE POLICY "proposals_update_policy" ON proposals
FOR UPDATE USING (
  provider_id = auth.uid() OR
  EXISTS (SELECT 1 FROM gigs g WHERE g.id = gig_id AND g.user_id = auth.uid())
);

-- Tabela de conversas (se não existir)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(gig_id, client_id, provider_id)
);

-- RLS para conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_select_policy" ON conversations
FOR SELECT USING (
  client_id = auth.uid() OR 
  provider_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

CREATE POLICY "conversations_insert_policy" ON conversations
FOR INSERT WITH CHECK (
  client_id = auth.uid() OR provider_id = auth.uid()
);

-- Tabela de mensagens (se não existir)
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_policy" ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations c 
    WHERE c.id = conversation_id AND 
    (c.client_id = auth.uid() OR c.provider_id = auth.uid())
  ) OR
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

CREATE POLICY "messages_insert_policy" ON messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM conversations c 
    WHERE c.id = conversation_id AND 
    (c.client_id = auth.uid() OR c.provider_id = auth.uid())
  )
);

-- Tabela de reviews (se não existir)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
  comment TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(gig_id, reviewer_id, reviewee_id)
);

-- RLS para reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_policy" ON reviews
FOR SELECT USING (
  is_public = TRUE OR 
  reviewer_id = auth.uid() OR 
  reviewee_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

CREATE POLICY "reviews_insert_policy" ON reviews
FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- Tabela de pagamentos (se não existir)
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  stripe_payment_intent_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')),
  escrow_status VARCHAR(20) DEFAULT 'held' CHECK (escrow_status IN ('held', 'released', 'disputed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_policy" ON payments
FOR SELECT USING (
  payer_id = auth.uid() OR 
  payee_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Tabela de faturas (se não existir)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_select_policy" ON invoices
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.id = payment_id AND 
    (p.payer_id = auth.uid() OR p.payee_id = auth.uid())
  ) OR
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- 3. CRIAR ÍNDICES PARA PERFORMANCE

-- Índices para gigs
CREATE INDEX IF NOT EXISTS idx_gigs_user_id ON gigs(user_id);
CREATE INDEX IF NOT EXISTS idx_gigs_category_id ON gigs(category_id);
CREATE INDEX IF NOT EXISTS idx_gigs_status ON gigs(status);
CREATE INDEX IF NOT EXISTS idx_gigs_created_at ON gigs(created_at DESC);

-- Índices para proposals
CREATE INDEX IF NOT EXISTS idx_proposals_gig_id ON proposals(gig_id);
CREATE INDEX IF NOT EXISTS idx_proposals_provider_id ON proposals(provider_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);

-- Índices para conversations
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_provider_id ON conversations(provider_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- Índices para messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Índices para reviews
CREATE INDEX IF NOT EXISTS idx_reviews_gig_id ON reviews(gig_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_overall_rating ON reviews(overall_rating);

-- Índices para payments
CREATE INDEX IF NOT EXISTS idx_payments_gig_id ON payments(gig_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer_id ON payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_payments_payee_id ON payments(payee_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 4. CRIAR FUNÇÕES ÚTEIS

-- Função para obter perfil do utilizador
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  plan TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.plan,
    p.avatar_url,
    p.created_at
  FROM profiles p
  WHERE p.id = user_id;
END;
$$;

-- Função para calcular rating médio
CREATE OR REPLACE FUNCTION calculate_average_rating(user_id UUID)
RETURNS DECIMAL(3,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_rating DECIMAL(3,2);
BEGIN
  SELECT AVG(overall_rating)::DECIMAL(3,2)
  INTO avg_rating
  FROM reviews
  WHERE reviewee_id = user_id AND is_public = TRUE;
  
  RETURN COALESCE(avg_rating, 0);
END;
$$;

-- Função para contar gigs ativos
CREATE OR REPLACE FUNCTION count_active_gigs(user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  gig_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO gig_count
  FROM gigs
  WHERE user_id = user_id AND status = 'published';
  
  RETURN COALESCE(gig_count, 0);
END;
$$;

-- 5. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger às tabelas relevantes
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gigs_updated_at ON gigs;
CREATE TRIGGER update_gigs_updated_at
  BEFORE UPDATE ON gigs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_proposals_updated_at ON proposals;
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. INSERIR CATEGORIAS BÁSICAS SE NÃO EXISTIREM

INSERT INTO categories (name, slug, description, icon, is_active, sort_order)
VALUES 
  ('Desenvolvimento Web', 'desenvolvimento-web', 'Criação de websites e aplicações web', 'code', true, 1),
  ('Design Gráfico', 'design-grafico', 'Criação de logotipos, banners e materiais visuais', 'palette', true, 2),
  ('Marketing Digital', 'marketing-digital', 'Gestão de redes sociais e campanhas online', 'megaphone', true, 3),
  ('Redação e Tradução', 'redacao-traducao', 'Criação de conteúdo e serviços de tradução', 'pen-tool', true, 4),
  ('Consultoria', 'consultoria', 'Serviços de consultoria empresarial', 'briefcase', true, 5),
  ('Fotografia', 'fotografia', 'Serviços fotográficos profissionais', 'camera', true, 6),
  ('Vídeo e Animação', 'video-animacao', 'Produção de vídeos e animações', 'video', true, 7),
  ('Música e Áudio', 'musica-audio', 'Produção musical e edição de áudio', 'music', true, 8),
  ('Educação', 'educacao', 'Serviços educacionais e formação', 'book-open', true, 9),
  ('Outros Serviços', 'outros-servicos', 'Outros serviços profissionais', 'more-horizontal', true, 10)
ON CONFLICT (slug) DO NOTHING;

-- 7. CRIAR UTILIZADOR ADMIN SE NÃO EXISTIR

-- Esta parte será executada apenas se não existir um admin
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM profiles WHERE role = 'admin';
  
  IF admin_count = 0 THEN
    -- Inserir perfil admin temporário (será substituído por registo real)
    INSERT INTO profiles (
      id, 
      email, 
      full_name, 
      role, 
      plan,
      created_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000001',
      'admin@biskate.com',
      'Administrador Sistema',
      'admin',
      'premium',
      NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      plan = 'premium';
  END IF;
END $$;

-- 8. VERIFICAR INTEGRIDADE DOS DADOS

-- Verificar se todas as tabelas têm RLS ativado
DO $$
DECLARE
  table_name TEXT;
  tables_to_check TEXT[] := ARRAY['profiles', 'categories', 'gigs', 'proposals', 'conversations', 'messages', 'reviews', 'payments', 'invoices', 'notifications'];
BEGIN
  FOREACH table_name IN ARRAY tables_to_check
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;
END $$;

-- Commit das alterações
COMMIT;

-- Log de conclusão
SELECT 'Correções críticas Fase 1 aplicadas com sucesso!' as status;

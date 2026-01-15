-- Atualizar a tabela profiles para incluir campos de prestador
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_provider BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS provider_status TEXT CHECK (provider_status IN ('inactive', 'pending', 'approved', 'rejected', 'suspended')),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB,
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  margin_percentage NUMERIC(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  icon TEXT,
  slug TEXT NOT NULL UNIQUE
);

-- Criar tabela de taxas
CREATE TABLE IF NOT EXISTS tax_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  rate NUMERIC(5,2) NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de categorias de prestador
CREATE TABLE IF NOT EXISTS provider_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_id, category_id)
);

-- Criar tabela de documentos de prestador
CREATE TABLE IF NOT EXISTS provider_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('id', 'address', 'certification', 'portfolio', 'other')),
  document_url TEXT NOT NULL,
  document_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de portfolio de prestador
CREATE TABLE IF NOT EXISTS provider_portfolio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de disponibilidade de prestador
CREATE TABLE IF NOT EXISTS provider_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(provider_id, day_of_week, start_time, end_time)
);

-- Criar tabela de avaliações de prestador
CREATE TABLE IF NOT EXISTS provider_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(provider_id, reviewer_id, gig_id)
);

-- Atualizar tabela de gigs para incluir novos campos
ALTER TABLE gigs
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS skills_required JSONB,
ADD COLUMN IF NOT EXISTS attachments JSONB;

-- Atualizar tabela de gig_responses para incluir novos campos
ALTER TABLE gig_responses
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')),
ADD COLUMN IF NOT EXISTS proposed_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS estimated_completion TIMESTAMP WITH TIME ZONE;

-- Criar políticas RLS para as novas tabelas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas para categorias
CREATE POLICY "Categorias visíveis para todos" ON categories
  FOR SELECT USING (true);
  
CREATE POLICY "Apenas admins podem criar categorias" ON categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));
  
CREATE POLICY "Apenas admins podem atualizar categorias" ON categories
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
  
CREATE POLICY "Apenas admins podem excluir categorias" ON categories
  FOR DELETE USING (
    auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Políticas para taxas
CREATE POLICY "Taxas visíveis para todos" ON tax_rates
  FOR SELECT USING (true);
  
CREATE POLICY "Apenas admins podem gerenciar taxas" ON tax_rates
  FOR ALL USING (
    auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Políticas para categorias de prestador
CREATE POLICY "Prestadores podem ver suas categorias" ON provider_categories
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      provider_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
  );
  
CREATE POLICY "Prestadores podem gerenciar suas categorias" ON provider_categories
  FOR ALL USING (
    auth.role() = 'authenticated' AND (
      provider_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
  );

-- Políticas para documentos de prestador
CREATE POLICY "Prestadores podem ver seus documentos" ON provider_documents
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      provider_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
  );
  
CREATE POLICY "Prestadores podem enviar documentos" ON provider_documents
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND provider_id = auth.uid()
  );
  
CREATE POLICY "Apenas admins podem atualizar status de documentos" ON provider_documents
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      (provider_id = auth.uid() AND NEW.status = OLD.status) OR
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
  );

-- Políticas para portfolio de prestador
CREATE POLICY "Portfolios são públicos" ON provider_portfolio
  FOR SELECT USING (true);
  
CREATE POLICY "Prestadores podem gerenciar seu portfolio" ON provider_portfolio
  FOR ALL USING (
    auth.role() = 'authenticated' AND (
      provider_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
  );

-- Políticas para disponibilidade de prestador
CREATE POLICY "Disponibilidade é pública" ON provider_availability
  FOR SELECT USING (true);
  
CREATE POLICY "Prestadores podem gerenciar sua disponibilidade" ON provider_availability
  FOR ALL USING (
    auth.role() = 'authenticated' AND (
      provider_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
  );

-- Políticas para avaliações de prestador
CREATE POLICY "Avaliações são públicas" ON provider_reviews
  FOR SELECT USING (true);
  
CREATE POLICY "Clientes podem avaliar prestadores após conclusão do gig" ON provider_reviews
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    reviewer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM gigs 
      WHERE gigs.id = gig_id 
      AND gigs.author_id = auth.uid()
      AND gigs.status = 'completed'
    )
  );
  
CREATE POLICY "Usuários podem editar suas próprias avaliações" ON provider_reviews
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND reviewer_id = auth.uid()
  );

-- Inserir algumas categorias iniciais
INSERT INTO categories (name, description, parent_id, margin_percentage, slug)
VALUES 
  ('Tecnologia', 'Serviços relacionados à tecnologia', NULL, 10.0, 'tecnologia'),
  ('Design', 'Serviços de design gráfico e web', NULL, 8.0, 'design'),
  ('Limpeza', 'Serviços de limpeza residencial e comercial', NULL, 5.0, 'limpeza'),
  ('Reparações', 'Serviços de reparação e manutenção', NULL, 7.0, 'reparacoes'),
  ('Educação', 'Serviços educacionais e de tutoria', NULL, 6.0, 'educacao');

-- Inserir algumas subcategorias
DO $$
DECLARE
  tech_id UUID;
  design_id UUID;
  repair_id UUID;
BEGIN
  SELECT id INTO tech_id FROM categories WHERE slug = 'tecnologia';
  SELECT id INTO design_id FROM categories WHERE slug = 'design';
  SELECT id INTO repair_id FROM categories WHERE slug = 'reparacoes';
  
  INSERT INTO categories (name, description, parent_id, margin_percentage, slug)
  VALUES 
    ('Desenvolvimento Web', 'Criação de websites e aplicações web', tech_id, 12.0, 'desenvolvimento-web'),
    ('Suporte Técnico', 'Assistência técnica para computadores e dispositivos', tech_id, 8.0, 'suporte-tecnico'),
    ('Design Gráfico', 'Criação de materiais visuais e branding', design_id, 9.0, 'design-grafico'),
    ('UI/UX Design', 'Design de interfaces e experiência do usuário', design_id, 10.0, 'ui-ux-design'),
    ('Eletricidade', 'Serviços de instalação e reparação elétrica', repair_id, 7.5, 'eletricidade'),
    ('Canalização', 'Serviços de canalização e reparação de fugas', repair_id, 6.5, 'canalizacao');
END $$;

-- Inserir taxas iniciais
INSERT INTO tax_rates (name, rate, country, is_default)
VALUES 
  ('IVA Normal', 23.0, 'Portugal', true),
  ('IVA Reduzido', 13.0, 'Portugal', false),
  ('IVA Super Reduzido', 6.0, 'Portugal', false);

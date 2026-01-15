-- Limpar tabelas existentes se existirem
DROP TABLE IF EXISTS gigs CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Criar tabela de categorias
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de gigs (biskates)
CREATE TABLE gigs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  location VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir categorias padrão
INSERT INTO categories (name, description, icon) VALUES
('Limpeza', 'Serviços de limpeza doméstica e comercial', 'cleaning'),
('Canalizador', 'Reparações e instalações de canalização', 'wrench'),
('Eletricista', 'Serviços elétricos e instalações', 'zap'),
('Pintura', 'Pintura de interiores e exteriores', 'paintbrush'),
('Jardinagem', 'Manutenção de jardins e espaços verdes', 'tree'),
('Educação', 'Explicações e formação', 'book'),
('Tecnologia', 'Suporte técnico e informático', 'laptop'),
('Transporte', 'Mudanças e transporte de bens', 'truck'),
('Cozinha', 'Serviços de catering e culinária', 'chef-hat'),
('Outros', 'Outros serviços diversos', 'more-horizontal');

-- Habilitar RLS
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Políticas para gigs
CREATE POLICY "Todos podem ver gigs aprovados" ON gigs
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Utilizadores podem criar gigs" ON gigs
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Autores podem ver os seus gigs" ON gigs
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Autores podem atualizar os seus gigs" ON gigs
  FOR UPDATE USING (auth.uid() = author_id);

-- Políticas para categorias
CREATE POLICY "Todos podem ver categorias" ON categories
  FOR SELECT USING (true);

-- Criar alguns gigs de exemplo
INSERT INTO gigs (title, description, category, location, price, author_id, status) VALUES
('Limpeza de apartamento T2', 'Preciso de limpeza completa do meu apartamento T2 em Lisboa', 'Limpeza', 'Lisboa', 45.00, (SELECT id FROM profiles WHERE email = 'pmbonanca@gmail.com' LIMIT 1), 'approved'),
('Reparação de torneira', 'Torneira da cozinha está a pingar, preciso de canalizador', 'Canalizador', 'Porto', 30.00, (SELECT id FROM profiles WHERE email = 'pmbonanca@gmail.com' LIMIT 1), 'approved');

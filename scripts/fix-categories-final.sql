-- Script final para corrigir categorias
BEGIN;

-- 1. Remover tabela se existir
DROP TABLE IF EXISTS categories CASCADE;

-- 2. Criar tabela categories
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    margin_percentage DECIMAL(5,2) DEFAULT 10.0,
    is_active BOOLEAN DEFAULT true,
    icon VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    color_hex VARCHAR(7) DEFAULT '#3B82F6',
    commission_type VARCHAR(20) DEFAULT 'percentage',
    min_price DECIMAL(10,2) DEFAULT 5.0,
    max_price DECIMAL(10,2),
    requires_verification BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Inserir categorias de teste
INSERT INTO categories (name, description, slug, margin_percentage, is_active, icon, featured) VALUES
('Limpeza Doméstica', 'Serviços de limpeza para casa e escritório', 'limpeza-domestica', 12.0, true, '🧹', true),
('Reparações Casa', 'Reparações e manutenção doméstica', 'reparacoes-casa', 15.0, true, '🔧', true),
('Jardinagem', 'Cuidados com jardins e plantas', 'jardinagem', 10.0, true, '🌱', true),
('Transporte', 'Mudanças e transporte de bens', 'transporte', 8.0, true, '🚚', false),
('Tecnologia', 'Suporte informático e técnico', 'tecnologia', 20.0, true, '💻', true),
('Educação', 'Aulas e formação', 'educacao', 18.0, true, '📚', true),
('Saúde e Bem-estar', 'Serviços de saúde e fitness', 'saude-bem-estar', 25.0, true, '💪', false),
('Eventos', 'Organização de eventos e festas', 'eventos', 20.0, true, '🎉', true);

-- 4. Configurar RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 5. Remover políticas antigas
DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "categories_admin_all" ON categories;
DROP POLICY IF EXISTS "Categories são públicas para leitura" ON categories;
DROP POLICY IF EXISTS "Apenas admins podem modificar categories" ON categories;
DROP POLICY IF EXISTS "Leitura pública de categorias" ON categories;
DROP POLICY IF EXISTS "Admins podem modificar categorias" ON categories;
DROP POLICY IF EXISTS "public_read_categories" ON categories;
DROP POLICY IF EXISTS "admin_all_categories" ON categories;

-- 6. Criar políticas simples
CREATE POLICY "categories_select_all" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_modify" ON categories FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- 7. Verificar inserção
SELECT COUNT(*) as total_categorias FROM categories;

COMMIT;

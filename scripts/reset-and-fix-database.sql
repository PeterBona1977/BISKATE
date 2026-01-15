-- Reset completo e correção da base de dados
BEGIN;

-- 1. Limpar e recriar tabela categories
DROP TABLE IF EXISTS categories CASCADE;
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id UUID REFERENCES categories(id),
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

-- 2. Inserir categorias básicas
INSERT INTO categories (name, description, slug, margin_percentage, is_active, icon, featured) VALUES
('Limpeza Doméstica', 'Serviços de limpeza para casa e escritório', 'limpeza-domestica', 12.0, true, '🧹', true),
('Reparações Casa', 'Reparações e manutenção doméstica', 'reparacoes-casa', 15.0, true, '🔧', true),
('Jardinagem', 'Cuidados com jardins e plantas', 'jardinagem', 10.0, true, '🌱', true),
('Transporte', 'Mudanças e transporte de bens', 'transporte', 8.0, true, '🚚', false),
('Tecnologia', 'Suporte informático e técnico', 'tecnologia', 20.0, true, '💻', true),
('Educação', 'Aulas e formação', 'educacao', 18.0, true, '📚', true),
('Saúde e Bem-estar', 'Serviços de saúde e fitness', 'saude-bem-estar', 25.0, true, '💪', false),
('Eventos', 'Organização de eventos e festas', 'eventos', 20.0, true, '🎉', true);

-- 3. Configurar RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS simples e funcionais
CREATE POLICY "categories_public_read" ON categories 
    FOR SELECT USING (true);

CREATE POLICY "categories_admin_all" ON categories 
    FOR ALL USING (
        auth.uid() IS NOT NULL AND (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
            OR auth.uid()::text = 'ca169c31-374f-45c4-ba98-5cb21288cc22'
        )
    );

COMMIT;

-- Verificar resultado
SELECT COUNT(*) as total_categorias, string_agg(name, ', ') as nomes FROM categories;

-- Melhorar sistema de categorias com funcionalidades avançadas
-- Adicionar campos em falta e otimizar estrutura

-- Adicionar campos em falta na tabela categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS color_hex VARCHAR(7) DEFAULT '#6366f1',
ADD COLUMN IF NOT EXISTS commission_type VARCHAR(20) DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS min_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS requires_verification BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_featured ON categories(featured);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Função para calcular margem efetiva (herança)
CREATE OR REPLACE FUNCTION get_effective_margin(category_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    category_margin DECIMAL(5,2);
    parent_margin DECIMAL(5,2);
    parent_id UUID;
BEGIN
    -- Buscar margem da categoria atual
    SELECT margin_percentage, parent_id INTO category_margin, parent_id
    FROM categories 
    WHERE id = category_id;
    
    -- Se não tem margem definida e tem pai, herdar do pai
    IF category_margin IS NULL OR category_margin = 0 THEN
        IF parent_id IS NOT NULL THEN
            SELECT get_effective_margin(parent_id) INTO parent_margin;
            RETURN COALESCE(parent_margin, 10.0); -- Default 10%
        ELSE
            RETURN 10.0; -- Default para categorias principais
        END IF;
    END IF;
    
    RETURN category_margin;
END;
$$ LANGUAGE plpgsql;

-- Função para obter hierarquia completa de uma categoria
CREATE OR REPLACE FUNCTION get_category_hierarchy(category_id UUID)
RETURNS TABLE(
    id UUID,
    name VARCHAR,
    level INTEGER,
    path TEXT
) AS $$
WITH RECURSIVE category_tree AS (
    -- Caso base: categoria atual
    SELECT 
        c.id,
        c.name,
        0 as level,
        c.name::TEXT as path
    FROM categories c
    WHERE c.id = category_id
    
    UNION ALL
    
    -- Caso recursivo: pais da categoria
    SELECT 
        p.id,
        p.name,
        ct.level + 1,
        (p.name || ' > ' || ct.path)::TEXT
    FROM categories p
    INNER JOIN category_tree ct ON p.id = (
        SELECT parent_id FROM categories WHERE id = ct.id
    )
)
SELECT * FROM category_tree ORDER BY level DESC;
$$ LANGUAGE sql;

-- Inserir categorias padrão se não existirem
INSERT INTO categories (name, description, slug, margin_percentage, is_active, icon, display_order, color_hex, featured) 
VALUES 
    ('Limpeza', 'Serviços de limpeza doméstica e comercial', 'limpeza', 12.0, true, '🧹', 1, '#10b981', true),
    ('Reparações', 'Reparações e manutenção doméstica', 'reparacoes', 15.0, true, '🔧', 2, '#f59e0b', true),
    ('Jardinagem', 'Cuidados com jardins e espaços verdes', 'jardinagem', 10.0, true, '🌱', 3, '#22c55e', true),
    ('Transporte', 'Serviços de transporte e mudanças', 'transporte', 8.0, true, '🚚', 4, '#3b82f6', true),
    ('Tecnologia', 'Suporte técnico e informático', 'tecnologia', 20.0, true, '💻', 5, '#8b5cf6', true),
    ('Educação', 'Explicações e formação', 'educacao', 18.0, true, '📚', 6, '#06b6d4', true),
    ('Animais', 'Cuidados com animais de estimação', 'animais', 12.0, true, '🐕', 7, '#f97316', true),
    ('Eventos', 'Organização de eventos e festas', 'eventos', 15.0, true, '🎉', 8, '#ec4899', true),
    ('Beleza', 'Serviços de beleza e bem-estar', 'beleza', 16.0, true, '💄', 9, '#ef4444', true),
    ('Outros', 'Outros serviços diversos', 'outros', 10.0, true, '📦', 10, '#6b7280', false)
ON CONFLICT (slug) DO NOTHING;

-- Inserir algumas subcategorias de exemplo
DO $$
DECLARE
    limpeza_id UUID;
    reparacoes_id UUID;
    jardinagem_id UUID;
BEGIN
    -- Buscar IDs das categorias principais
    SELECT id INTO limpeza_id FROM categories WHERE slug = 'limpeza';
    SELECT id INTO reparacoes_id FROM categories WHERE slug = 'reparacoes';
    SELECT id INTO jardinagem_id FROM categories WHERE slug = 'jardinagem';
    
    -- Subcategorias de Limpeza
    INSERT INTO categories (name, description, slug, parent_id, margin_percentage, is_active, icon, display_order) 
    VALUES 
        ('Limpeza Doméstica', 'Limpeza de casas e apartamentos', 'limpeza-domestica', limpeza_id, NULL, true, '🏠', 1),
        ('Limpeza de Escritórios', 'Limpeza de espaços comerciais', 'limpeza-escritorios', limpeza_id, 14.0, true, '🏢', 2),
        ('Limpeza Pós-Obra', 'Limpeza após construção/renovação', 'limpeza-pos-obra', limpeza_id, 18.0, true, '🚧', 3)
    ON CONFLICT (slug) DO NOTHING;
    
    -- Subcategorias de Reparações
    INSERT INTO categories (name, description, slug, parent_id, margin_percentage, is_active, icon, display_order) 
    VALUES 
        ('Eletricidade', 'Instalações e reparações elétricas', 'eletricidade', reparacoes_id, 20.0, true, '⚡', 1),
        ('Canalizações', 'Reparações de água e esgotos', 'canalizacoes', reparacoes_id, 18.0, true, '🚰', 2),
        ('Pintura', 'Pintura de interiores e exteriores', 'pintura', reparacoes_id, NULL, true, '🎨', 3),
        ('Carpintaria', 'Trabalhos em madeira', 'carpintaria', reparacoes_id, 16.0, true, '🪚', 4)
    ON CONFLICT (slug) DO NOTHING;
    
    -- Subcategorias de Jardinagem
    INSERT INTO categories (name, description, slug, parent_id, margin_percentage, is_active, icon, display_order) 
    VALUES 
        ('Manutenção de Jardins', 'Cuidados regulares com jardins', 'manutencao-jardins', jardinagem_id, NULL, true, '✂️', 1),
        ('Paisagismo', 'Design e criação de jardins', 'paisagismo', jardinagem_id, 12.0, true, '🌺', 2),
        ('Poda de Árvores', 'Poda e cuidados com árvores', 'poda-arvores', jardinagem_id, 8.0, true, '🌳', 3)
    ON CONFLICT (slug) DO NOTHING;
END $$;

-- Atualizar RLS policies para categories
DROP POLICY IF EXISTS "Categories são públicas para leitura" ON categories;
DROP POLICY IF EXISTS "Apenas admins podem modificar categories" ON categories;

CREATE POLICY "Categories são públicas para leitura" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem modificar categories" ON categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Criar view para categorias com informações calculadas
CREATE OR REPLACE VIEW categories_with_stats AS
SELECT 
    c.*,
    get_effective_margin(c.id) as effective_margin,
    COALESCE(subcats.subcategory_count, 0) as subcategory_count,
    COALESCE(gigs.gig_count, 0) as gig_count,
    CASE 
        WHEN c.parent_id IS NULL THEN 0
        ELSE 1
    END as category_level
FROM categories c
LEFT JOIN (
    SELECT parent_id, COUNT(*) as subcategory_count
    FROM categories 
    WHERE parent_id IS NOT NULL AND is_active = true
    GROUP BY parent_id
) subcats ON c.id = subcats.parent_id
LEFT JOIN (
    SELECT category, COUNT(*) as gig_count
    FROM gigs 
    WHERE status = 'approved'
    GROUP BY category
) gigs ON c.name = gigs.category
ORDER BY c.display_order, c.name;

COMMENT ON VIEW categories_with_stats IS 'View com estatísticas calculadas das categorias';

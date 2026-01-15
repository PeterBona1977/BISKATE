-- Script para criar tabelas do Sistema de Gestão de Conteúdo (CMS) Interno
-- Execute este script no SQL Editor do dashboard do Supabase

-- 1. Tabela para páginas estáticas
CREATE TABLE IF NOT EXISTS public.cms_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  featured_image TEXT,
  author_id UUID REFERENCES public.profiles(id),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela para versões das páginas (controlo de versões)
CREATE TABLE IF NOT EXISTS public.cms_page_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID REFERENCES public.cms_pages(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela para secções dinâmicas
CREATE TABLE IF NOT EXISTS public.cms_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID REFERENCES public.cms_pages(id) ON DELETE CASCADE,
  section_type VARCHAR(50) NOT NULL, -- hero, content, gallery, etc
  title VARCHAR(500),
  content TEXT,
  settings JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela para menus de navegação
CREATE TABLE IF NOT EXISTS public.cms_menus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(50) NOT NULL, -- header, footer, sidebar
  items JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela para gestão de media/ficheiros
CREATE TABLE IF NOT EXISTS public.cms_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON public.cms_pages(slug);
CREATE INDEX IF NOT EXISTS idx_cms_pages_status ON public.cms_pages(status);
CREATE INDEX IF NOT EXISTS idx_cms_sections_page_id ON public.cms_sections(page_id);
CREATE INDEX IF NOT EXISTS idx_cms_sections_type ON public.cms_sections(section_type);
CREATE INDEX IF NOT EXISTS idx_cms_media_type ON public.cms_media(mime_type);

-- 7. Habilitar RLS (Row Level Security)
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas RLS (apenas admins podem gerir CMS)
-- Políticas para cms_pages
CREATE POLICY "Admins can manage cms pages"
ON public.cms_pages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Public can view published pages"
ON public.cms_pages
FOR SELECT
USING (status = 'published' AND published_at <= NOW());

-- Políticas para cms_sections
CREATE POLICY "Admins can manage cms sections"
ON public.cms_sections
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Public can view active sections"
ON public.cms_sections
FOR SELECT
USING (is_active = true);

-- Políticas para cms_menus
CREATE POLICY "Admins can manage cms menus"
ON public.cms_menus
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Public can view active menus"
ON public.cms_menus
FOR SELECT
USING (is_active = true);

-- Políticas para cms_media
CREATE POLICY "Admins can manage cms media"
ON public.cms_media
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Public can view media"
ON public.cms_media
FOR SELECT
USING (true);

-- 9. Inserir dados iniciais para demonstração
INSERT INTO public.cms_pages (title, slug, content, meta_description, meta_keywords, status, published_at) VALUES
('Sobre Nós', 'sobre-nos', '<h1>Sobre o BISKATE</h1><p>O BISKATE é a plataforma líder em Portugal para conectar pessoas que precisam de serviços com prestadores qualificados.</p>', 'Conheça a história e missão do BISKATE, a plataforma de biscates mais confiável de Portugal.', 'biskate, plataforma, serviços, prestadores', 'published', NOW()),
('Termos e Condições', 'termos-condicoes', '<h1>Termos e Condições</h1><p>Estes termos regem o uso da plataforma BISKATE.</p>', 'Leia os termos e condições de uso da plataforma BISKATE.', 'termos, condições, uso, plataforma', 'published', NOW()),
('Política de Privacidade', 'politica-privacidade', '<h1>Política de Privacidade</h1><p>A sua privacidade é importante para nós.</p>', 'Conheça como protegemos os seus dados pessoais no BISKATE.', 'privacidade, dados, pessoais', 'published', NOW()),
('FAQ', 'faq', '<h1>Perguntas Frequentes</h1><h2>Como funciona o BISKATE?</h2><p>O BISKATE conecta pessoas que precisam de serviços com prestadores qualificados.</p>', 'Encontre respostas para as perguntas mais frequentes sobre o BISKATE.', 'faq, perguntas, frequentes', 'published', NOW());

INSERT INTO public.cms_sections (page_id, section_type, title, content) VALUES
((SELECT id FROM public.cms_pages WHERE slug = 'sobre-nos'), 'hero', 'Secção Principal', '{"title": "Encontre o Biscate Perfeito", "subtitle": "Conectamos pessoas que precisam de serviços com prestadores qualificados", "cta_text": "Começar Agora", "cta_link": "/register"}'),
((SELECT id FROM public.cms_pages WHERE slug = 'como-funciona'), 'content', 'Como Funciona', '{"steps": [{"title": "1. Publique o seu Biscate", "description": "Descreva o serviço que precisa"}, {"title": "2. Receba Propostas", "description": "Prestadores qualificados respondem"}, {"title": "3. Escolha o Melhor", "description": "Compare e escolha a melhor opção"}]}'),
((SELECT id FROM public.cms_pages WHERE slug = 'sobre-nos'), 'gallery', 'Testemunhos', '{"testimonials": [{"name": "Maria Silva", "text": "Encontrei um excelente eletricista através do BISKATE!", "rating": 5}, {"name": "João Santos", "text": "Plataforma muito fácil de usar e prestadores confiáveis.", "rating": 5}]}');

INSERT INTO public.cms_menus (name, location, items) VALUES
('Menu Principal', 'header', '[{"label": "Início", "url": "/", "order": 1}, {"label": "Como Funciona", "url": "/como-funciona", "order": 2}, {"label": "Sobre Nós", "url": "/sobre-nos", "order": 3}, {"label": "FAQ", "url": "/faq", "order": 4}, {"label": "Contactos", "url": "/contactos", "order": 5}]'),
('Menu Rodapé', 'footer', '[{"label": "Termos e Condições", "url": "/termos-condicoes", "order": 1}, {"label": "Política de Privacidade", "url": "/politica-privacidade", "order": 2}, {"label": "Suporte", "url": "/suporte", "order": 3}]');

-- 10. Confirmar criação das tabelas
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name LIKE 'cms_%'
ORDER BY table_name, ordinal_position;

-- Confirmar políticas RLS
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE 'cms_%'
ORDER BY tablename, policyname;

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_cms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_cms_pages_updated_at ON public.cms_pages;
CREATE TRIGGER update_cms_pages_updated_at
    BEFORE UPDATE ON public.cms_pages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_cms_updated_at();

DROP TRIGGER IF EXISTS update_cms_sections_updated_at ON public.cms_sections;
CREATE TRIGGER update_cms_sections_updated_at
    BEFORE UPDATE ON public.cms_sections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_cms_updated_at();

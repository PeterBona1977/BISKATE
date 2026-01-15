-- PASSO 1: Setup limpo da base de dados BISKATE (Tabelas GIGS corrigidas)
-- Alinhado com o codigo frontend: 'gigs', 'gig_responses', 'user_id', 'gig_id'

BEGIN;

-- Limpar tudo primeiro
DROP TABLE IF EXISTS public.biskate_responses CASCADE;
DROP TABLE IF EXISTS public.biskates CASCADE;
DROP TABLE IF EXISTS public.gig_responses CASCADE;
DROP TABLE IF EXISTS public.gigs CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Desabilitar RLS em todas as tabelas existentes para evitar problemas durante o setup
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'ALTER TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- 1. Criar tabela de perfis (profiles)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'provider', 'admin')),
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'unlimited')),
    responses_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de categorias (categories)
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de gigs (antiga biskates)
-- Frontend usa: queries 'gigs', inserts 'user_id', filters 'status'
CREATE TABLE public.gigs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL, -- O codigo usa string direta em vez de ID as vezes, mas vamos manter simples
    -- category_id UUID REFERENCES public.categories(id), -- Opcional, se o codigo usar relations
    price DECIMAL(10,2),
    location TEXT,
    estimated_duration INTEGER,
    duration_unit TEXT,
    
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Adicionado para compatibilidade com leituras legacy
    
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed', 'cancelled', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para sincronizar user_id e author_id se um deles for nulo no insert
CREATE OR REPLACE FUNCTION public.sync_gig_authors()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.author_id IS NULL AND NEW.user_id IS NOT NULL THEN
        NEW.author_id := NEW.user_id;
    ELSIF NEW.user_id IS NULL AND NEW.author_id IS NOT NULL THEN
        NEW.user_id := NEW.author_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_gig_authors_trigger
    BEFORE INSERT OR UPDATE ON public.gigs
    FOR EACH ROW EXECUTE FUNCTION public.sync_gig_authors();


-- 4. Criar tabela de respostas (gig_responses)
CREATE TABLE public.gig_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id UUID REFERENCES public.gigs(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    proposed_price DECIMAL(10,2),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir categorias básicas
INSERT INTO public.categories (name, description, icon) VALUES
('Limpeza', 'Serviços de limpeza doméstica e comercial', 'cleaning'),
('Jardinagem', 'Manutenção de jardins e espaços verdes', 'garden'),
('Reparações', 'Reparações domésticas e manutenção', 'tools'),
('Pintura', 'Serviços de pintura interior e exterior', 'paint'),
('Eletricidade', 'Instalações e reparações elétricas', 'electric'),
('Canalizações', 'Serviços de canalizador', 'plumbing');

-- Dar permissões básicas
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilizador'),
        'client'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para novos utilizadores
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Admin User setup (opcional, copia do anterior)
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'pmbonanca@gmail.com' LIMIT 1;
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, email, full_name, role, plan)
        VALUES (admin_user_id, 'pmbonanca@gmail.com', 'Admin BISKATE', 'admin', 'unlimited')
        ON CONFLICT (id) DO UPDATE SET role = 'admin', plan = 'unlimited';
    END IF;
END $$;

COMMIT;

SELECT 'Schema GIGS corrigido com sucesso' as result;

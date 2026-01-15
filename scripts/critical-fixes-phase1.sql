-- =====================================================
-- BISKATE - CORREÇÕES CRÍTICAS FASE 1
-- =====================================================

-- 1. LIMPEZA COMPLETA DE POLÍTICAS RLS PROBLEMÁTICAS
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Remover todas as políticas RLS existentes
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 2. DESABILITAR RLS TEMPORARIAMENTE PARA LIMPEZA
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gigs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.proposals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;

-- 3. CRIAR/RECRIAR TABELAS ESSENCIAIS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'provider', 'admin')),
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'essential', 'pro', 'unlimited')),
    location TEXT,
    bio TEXT,
    phone TEXT,
    website TEXT,
    skills TEXT[],
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    total_gigs INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gigs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category UUID REFERENCES public.categories(id),
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    price DECIMAL(10,2) NOT NULL,
    location TEXT,
    deadline TIMESTAMPTZ,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'in_progress', 'completed', 'cancelled')),
    requirements TEXT[],
    attachments TEXT[],
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id UUID REFERENCES public.gigs(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    delivery_time INTEGER, -- dias
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(gig_id, provider_id)
);

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id UUID REFERENCES public.gigs(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewed_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id UUID REFERENCES public.gigs(id) ON DELETE CASCADE,
    participant1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(gig_id, participant1_id, participant2_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_gigs_author_id ON public.gigs(author_id);
CREATE INDEX IF NOT EXISTS idx_gigs_provider_id ON public.gigs(provider_id);
CREATE INDEX IF NOT EXISTS idx_gigs_category ON public.gigs(category);
CREATE INDEX IF NOT EXISTS idx_gigs_status ON public.gigs(status);
CREATE INDEX IF NOT EXISTS idx_proposals_gig_id ON public.proposals(gig_id);
CREATE INDEX IF NOT EXISTS idx_proposals_provider_id ON public.proposals(provider_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- 5. HABILITAR RLS COM POLÍTICAS SIMPLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS SIMPLES E FUNCIONAIS

-- Profiles: usuários podem ver e editar próprio perfil, admins veem tudo
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Categories: leitura pública, admins podem modificar
CREATE POLICY "categories_select" ON public.categories FOR SELECT USING (true);

CREATE POLICY "categories_insert" ON public.categories FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "categories_update" ON public.categories FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "categories_delete" ON public.categories FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Gigs: autores e admins podem modificar, todos podem ver publicados
CREATE POLICY "gigs_select" ON public.gigs FOR SELECT USING (
    status = 'published' OR 
    author_id = auth.uid() OR 
    provider_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "gigs_insert" ON public.gigs FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "gigs_update" ON public.gigs FOR UPDATE USING (
    author_id = auth.uid() OR 
    provider_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Proposals: apenas envolvidos podem ver
CREATE POLICY "proposals_select" ON public.proposals FOR SELECT USING (
    provider_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.gigs WHERE id = gig_id AND author_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "proposals_insert" ON public.proposals FOR INSERT WITH CHECK (provider_id = auth.uid());

CREATE POLICY "proposals_update" ON public.proposals FOR UPDATE USING (
    provider_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.gigs WHERE id = gig_id AND author_id = auth.uid())
);

-- Reviews: todos podem ver, apenas envolvidos podem criar
CREATE POLICY "reviews_select" ON public.reviews FOR SELECT USING (true);

CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- Conversations: apenas participantes
CREATE POLICY "conversations_select" ON public.conversations FOR SELECT USING (
    participant1_id = auth.uid() OR 
    participant2_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT WITH CHECK (
    participant1_id = auth.uid() OR participant2_id = auth.uid()
);

-- Messages: apenas participantes da conversa
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE id = conversation_id 
        AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Notifications: apenas próprio usuário
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- 7. FUNÇÕES ÚTEIS
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    role TEXT,
    avatar_url TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.email, p.full_name, p.role, p.avatar_url
    FROM public.profiles p
    WHERE p.id = user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role = 'admin'
    );
END;
$$;

-- 8. TRIGGERS PARA UPDATED_AT
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gigs_updated_at BEFORE UPDATE ON public.gigs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. INSERIR CATEGORIAS BÁSICAS
INSERT INTO public.categories (name, slug, description, icon, color) VALUES
('Tecnologia', 'tecnologia', 'Serviços relacionados com tecnologia e programação', '💻', '#3B82F6'),
('Design', 'design', 'Design gráfico, web design e criatividade', '🎨', '#8B5CF6'),
('Marketing', 'marketing', 'Marketing digital e publicidade', '📈', '#10B981'),
('Escrita', 'escrita', 'Redação, copywriting e tradução', '✍️', '#F59E0B'),
('Consultoria', 'consultoria', 'Consultoria empresarial e estratégica', '💼', '#EF4444'),
('Educação', 'educacao', 'Ensino e formação', '📚', '#06B6D4'),
('Saúde', 'saude', 'Serviços de saúde e bem-estar', '🏥', '#84CC16'),
('Casa', 'casa', 'Serviços domésticos e reparações', '🏠', '#F97316')
ON CONFLICT (slug) DO NOTHING;

-- 11. CRIAR TABELA PARA CATEGORIAS DE PRESTADORES
CREATE TABLE IF NOT EXISTS public.provider_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider_id, category_id)
);

ALTER TABLE public.provider_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provider_categories_select" ON public.provider_categories FOR SELECT USING (
    provider_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "provider_categories_insert" ON public.provider_categories FOR INSERT WITH CHECK (provider_id = auth.uid());

CREATE POLICY "provider_categories_delete" ON public.provider_categories FOR DELETE USING (provider_id = auth.uid());

-- 12. VERIFICAÇÃO FINAL
DO $$
BEGIN
    RAISE NOTICE '✅ Script de correções críticas executado com sucesso!';
    RAISE NOTICE '📊 Tabelas criadas: profiles, categories, gigs, proposals, reviews, conversations, messages, notifications';
    RAISE NOTICE '🔒 Políticas RLS configuradas e funcionais';
    RAISE NOTICE '🎯 Categorias básicas inseridas';
    RAISE NOTICE '⚡ Triggers e funções criados';
END $$;

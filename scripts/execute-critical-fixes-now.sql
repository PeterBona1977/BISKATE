-- =====================================================
-- BISKATE - CORREÇÕES CRÍTICAS COMPLETAS
-- Executar no Supabase SQL Editor
-- =====================================================

-- 1. CRIAR TABELAS EM FALTA
-- =====================================================

-- Tabela de propostas
CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gig_id UUID REFERENCES public.gigs(id) ON DELETE CASCADE,
    freelancer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    delivery_time INTEGER NOT NULL, -- em dias
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    gig_id UUID REFERENCES public.gigs(id) ON DELETE SET NULL,
    proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant1_id, participant2_id, gig_id)
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    file_url TEXT,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de avaliações
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewed_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(proposal_id, reviewer_id)
);

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
    payer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    payee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    stripe_payment_intent_id TEXT,
    stripe_charge_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de faturas
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ATIVAR RLS EM TODAS AS TABELAS
-- =====================================================

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- 3. CRIAR POLÍTICAS RLS OTIMIZADAS
-- =====================================================

-- Políticas para proposals
DROP POLICY IF EXISTS "proposals_select_policy" ON public.proposals;
CREATE POLICY "proposals_select_policy" ON public.proposals
    FOR SELECT USING (
        freelancer_id = auth.uid() OR 
        client_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "proposals_insert_policy" ON public.proposals;
CREATE POLICY "proposals_insert_policy" ON public.proposals
    FOR INSERT WITH CHECK (freelancer_id = auth.uid());

DROP POLICY IF EXISTS "proposals_update_policy" ON public.proposals;
CREATE POLICY "proposals_update_policy" ON public.proposals
    FOR UPDATE USING (
        freelancer_id = auth.uid() OR 
        client_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Políticas para conversations
DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;
CREATE POLICY "conversations_select_policy" ON public.conversations
    FOR SELECT USING (
        participant1_id = auth.uid() OR 
        participant2_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "conversations_insert_policy" ON public.conversations;
CREATE POLICY "conversations_insert_policy" ON public.conversations
    FOR INSERT WITH CHECK (
        participant1_id = auth.uid() OR participant2_id = auth.uid()
    );

-- Políticas para messages
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
CREATE POLICY "messages_select_policy" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
        ) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
CREATE POLICY "messages_insert_policy" ON public.messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Políticas para reviews
DROP POLICY IF EXISTS "reviews_select_policy" ON public.reviews;
CREATE POLICY "reviews_select_policy" ON public.reviews
    FOR SELECT USING (TRUE); -- Reviews são públicas

DROP POLICY IF EXISTS "reviews_insert_policy" ON public.reviews;
CREATE POLICY "reviews_insert_policy" ON public.reviews
    FOR INSERT WITH CHECK (reviewer_id = auth.uid());

DROP POLICY IF EXISTS "reviews_update_policy" ON public.reviews;
CREATE POLICY "reviews_update_policy" ON public.reviews
    FOR UPDATE USING (
        reviewer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Políticas para payments
DROP POLICY IF EXISTS "payments_select_policy" ON public.payments;
CREATE POLICY "payments_select_policy" ON public.payments
    FOR SELECT USING (
        payer_id = auth.uid() OR 
        payee_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "payments_insert_policy" ON public.payments;
CREATE POLICY "payments_insert_policy" ON public.payments
    FOR INSERT WITH CHECK (payer_id = auth.uid());

-- Políticas para invoices
DROP POLICY IF EXISTS "invoices_select_policy" ON public.invoices;
CREATE POLICY "invoices_select_policy" ON public.invoices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.payments 
            WHERE id = payment_id 
            AND (payer_id = auth.uid() OR payee_id = auth.uid())
        ) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 4. CRIAR ÍNDICES DE PERFORMANCE
-- =====================================================

-- Índices para proposals
CREATE INDEX IF NOT EXISTS idx_proposals_gig_id ON public.proposals(gig_id);
CREATE INDEX IF NOT EXISTS idx_proposals_freelancer_id ON public.proposals(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON public.proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON public.proposals(created_at DESC);

-- Índices para conversations
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON public.conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON public.conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_gig_id ON public.conversations(gig_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);

-- Índices para messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Índices para reviews
CREATE INDEX IF NOT EXISTS idx_reviews_proposal_id ON public.reviews(proposal_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON public.reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

-- Índices para payments
CREATE INDEX IF NOT EXISTS idx_payments_proposal_id ON public.payments(proposal_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer_id ON public.payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_payments_payee_id ON public.payments(payee_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- 5. CRIAR TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para todas as tabelas
DROP TRIGGER IF EXISTS update_proposals_updated_at ON public.proposals;
CREATE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON public.proposals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. INSERIR CATEGORIAS BÁSICAS (SE NÃO EXISTIREM)
-- =====================================================

INSERT INTO public.categories (name, description, icon, color)
SELECT * FROM (VALUES
    ('Desenvolvimento Web', 'Criação de websites e aplicações web', 'code', '#3B82F6'),
    ('Design Gráfico', 'Design de logótipos, materiais visuais e branding', 'palette', '#EF4444'),
    ('Marketing Digital', 'Promoção online, SEO e redes sociais', 'megaphone', '#10B981'),
    ('Redação e Conteúdo', 'Criação de textos, artigos e conteúdo', 'pen-tool', '#8B5CF6'),
    ('Consultoria', 'Aconselhamento profissional e estratégico', 'briefcase', '#F59E0B'),
    ('Tradução', 'Serviços de tradução e localização', 'globe', '#06B6D4'),
    ('Vídeo e Animação', 'Produção de vídeos e animações', 'video', '#EC4899'),
    ('Fotografia', 'Serviços fotográficos profissionais', 'camera', '#84CC16'),
    ('Música e Áudio', 'Produção musical e edição de áudio', 'music', '#F97316'),
    ('Programação', 'Desenvolvimento de software e aplicações', 'terminal', '#6366F1')
) AS new_categories(name, description, icon, color)
WHERE NOT EXISTS (
    SELECT 1 FROM public.categories WHERE categories.name = new_categories.name
);

-- 7. CRIAR UTILIZADOR ADMIN (SE NÃO EXISTIR)
-- =====================================================

-- Inserir perfil admin se não existir
INSERT INTO public.profiles (id, email, full_name, role, plan)
SELECT 
    '00000000-0000-0000-0000-000000000001'::uuid,
    'admin@biskate.com',
    'Administrador BISKATE',
    'admin',
    'premium'
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE role = 'admin'
);

-- 8. CRIAR FUNÇÕES RPC ESSENCIAIS
-- =====================================================

-- Função para obter estatísticas do sistema
CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM public.profiles),
        'total_gigs', (SELECT COUNT(*) FROM public.gigs),
        'total_categories', (SELECT COUNT(*) FROM public.categories),
        'total_proposals', (SELECT COUNT(*) FROM public.proposals),
        'total_conversations', (SELECT COUNT(*) FROM public.conversations),
        'total_messages', (SELECT COUNT(*) FROM public.messages),
        'total_reviews', (SELECT COUNT(*) FROM public.reviews),
        'total_payments', (SELECT COUNT(*) FROM public.payments),
        'active_gigs', (SELECT COUNT(*) FROM public.gigs WHERE status = 'published'),
        'pending_proposals', (SELECT COUNT(*) FROM public.proposals WHERE status = 'pending')
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Função para verificar saúde das tabelas
CREATE OR REPLACE FUNCTION public.check_table_health()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'profiles', json_build_object(
            'exists', (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')),
            'count', (SELECT COUNT(*) FROM public.profiles),
            'rls_enabled', (SELECT row_security FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles')
        ),
        'categories', json_build_object(
            'exists', (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories')),
            'count', (SELECT COUNT(*) FROM public.categories),
            'rls_enabled', (SELECT row_security FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories')
        ),
        'gigs', json_build_object(
            'exists', (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gigs')),
            'count', (SELECT COUNT(*) FROM public.gigs),
            'rls_enabled', (SELECT row_security FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gigs')
        ),
        'proposals', json_build_object(
            'exists', (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'proposals')),
            'count', (SELECT COUNT(*) FROM public.proposals),
            'rls_enabled', (SELECT row_security FROM pg_tables WHERE schemaname = 'public' AND tablename = 'proposals')
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.get_system_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_system_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.check_table_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_table_health() TO anon;

-- 9. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar tabelas criadas
SELECT 
    'Tabelas verificadas:' as status,
    COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'categories', 'gigs', 'proposals', 'conversations', 'messages', 'reviews', 'payments', 'invoices');

-- Verificar políticas RLS
SELECT 
    'Políticas RLS verificadas:' as status,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public';

-- Verificar funções RPC
SELECT 
    'Funções RPC verificadas:' as status,
    COUNT(*) as total_functions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('get_system_stats', 'check_table_health');

-- Verificar categorias
SELECT 
    'Categorias verificadas:' as status,
    COUNT(*) as total_categories
FROM public.categories;

-- Verificar utilizadores admin
SELECT 
    'Utilizadores admin verificados:' as status,
    COUNT(*) as total_admins
FROM public.profiles 
WHERE role = 'admin';

-- Mensagem final
SELECT '🎉 CORREÇÕES CRÍTICAS APLICADAS COM SUCESSO! 🎉' as resultado;

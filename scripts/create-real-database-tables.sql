-- Create real database tables for Biskate platform
BEGIN;

-- Create biskates table (formerly gigs)
CREATE TABLE IF NOT EXISTS public.biskates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    budget DECIMAL(10,2),
    location TEXT,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create biskate_responses table (formerly gig_responses)
CREATE TABLE IF NOT EXISTS public.biskate_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    biskate_id UUID REFERENCES public.biskates(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    proposed_price DECIMAL(10,2),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO public.categories (name, description, icon) VALUES
('Limpeza', 'Serviços de limpeza doméstica e comercial', 'cleaning'),
('Jardinagem', 'Manutenção de jardins e espaços verdes', 'garden'),
('Reparações', 'Reparações domésticas e manutenção', 'tools'),
('Pintura', 'Serviços de pintura interior e exterior', 'paint'),
('Eletricidade', 'Instalações e reparações elétricas', 'electric'),
('Canalizações', 'Serviços de canalizador', 'plumbing')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE public.biskates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biskate_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for biskates
CREATE POLICY "biskates_select_policy" ON public.biskates FOR SELECT USING (true);
CREATE POLICY "biskates_insert_policy" ON public.biskates FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "biskates_update_policy" ON public.biskates FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "biskates_delete_policy" ON public.biskates FOR DELETE USING (auth.uid() = client_id);

-- Create RLS policies for biskate_responses
CREATE POLICY "responses_select_policy" ON public.biskate_responses FOR SELECT USING (true);
CREATE POLICY "responses_insert_policy" ON public.biskate_responses FOR INSERT WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "responses_update_policy" ON public.biskate_responses FOR UPDATE USING (auth.uid() = provider_id);
CREATE POLICY "responses_delete_policy" ON public.biskate_responses FOR DELETE USING (auth.uid() = provider_id);

-- Create RLS policies for categories
CREATE POLICY "categories_select_policy" ON public.categories FOR SELECT USING (true);

-- Grant permissions
GRANT ALL ON public.biskates TO authenticated;
GRANT ALL ON public.biskate_responses TO authenticated;
GRANT SELECT ON public.categories TO authenticated;
GRANT SELECT ON public.categories TO anon;

COMMIT;

-- MASTER SETUP SCRIPT - BISKATE
-- Creates ALL tables required by the application
-- Run this in Supabase SQL Editor

BEGIN;

-- 1. CLEANUP (Drop everything to start fresh)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.sync_gig_authors() CASCADE;

DROP VIEW IF EXISTS public.reputation_stats CASCADE;
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.badges CASCADE;
DROP TABLE IF EXISTS public.review_reports CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.gig_responses CASCADE;
DROP TABLE IF EXISTS public.gigs CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Disable RLS for setup
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'ALTER TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- 2. CORE TABLES

-- PROFILES
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    website TEXT,
    phone TEXT,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'provider', 'admin')),
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'unlimited')),
    -- Provider specific fields
    is_provider BOOLEAN DEFAULT false,
    provider_status TEXT CHECK (provider_status IN ('pending', 'approved', 'rejected')),
    provider_verified_at TIMESTAMP WITH TIME ZONE,
    skills TEXT[],
    hourly_rate DECIMAL(10,2),
    responses_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CATEGORIES
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    parent_id UUID REFERENCES public.categories(id),
    margin_percentage DECIMAL(10,2) DEFAULT 10,
    slug TEXT UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GIGS
CREATE TABLE public.gigs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    price DECIMAL(10,2),
    location TEXT,
    estimated_duration INTEGER,
    duration_unit TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed', 'cancelled', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GIG RESPONSES (Proposals)
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

-- 3. CHAT MODULE

-- CONVERSATIONS
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id UUID REFERENCES public.gigs(id) ON DELETE SET NULL,
    participant1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MESSAGES
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    reply_to_id UUID REFERENCES public.messages(id),
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    read_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. REVIEWS & REPUTATION

-- REVIEWS
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id UUID REFERENCES public.gigs(id) ON DELETE SET NULL,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    review_type TEXT CHECK (review_type IN ('client_to_provider', 'provider_to_client')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    communication_rating INTEGER,
    quality_rating INTEGER,
    timeliness_rating INTEGER,
    professionalism_rating INTEGER,
    is_anonymous BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    moderated_at TIMESTAMP WITH TIME ZONE
);

-- BADGES
CREATE TABLE public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    criteria JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USER BADGES
CREATE TABLE public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_for TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- REVIEWS REPORTS
CREATE TABLE public.review_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. NOTIFICATIONS
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. VIEWS & FUNCTIONS

-- REPUTATION STATS VIEW
CREATE OR REPLACE VIEW public.reputation_stats AS
SELECT
  reviewee_id as user_id,
  COUNT(*) as total_reviews_received,
  COALESCE(AVG(rating), 0) as average_rating,
  COALESCE(AVG(communication_rating), 0) as avg_communication,
  COALESCE(AVG(quality_rating), 0) as avg_quality,
  COALESCE(AVG(timeliness_rating), 0) as avg_timeliness,
  COALESCE(AVG(professionalism_rating), 0) as avg_professionalism
FROM public.reviews
WHERE status = 'approved'
GROUP BY reviewee_id;

-- FUNCTION: Mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(conversation_uuid uuid, user_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.messages
  SET read_at = NOW()
  WHERE conversation_id = conversation_uuid
  AND sender_id != user_uuid
  AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCTION: Sync Gig Authors
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

-- FUNCTION: Handle New User (Profile Creation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, plan)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilizador'),
        'client',
        'free'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. SEED INITIAL DATA

-- Categories
INSERT INTO public.categories (name, description, icon) VALUES
('Limpeza', 'Serviços de limpeza', 'cleaning'),
('Jardinagem', 'Manutenção de jardins', 'garden'),
('Reparações', 'Reparações gerais', 'tools'),
('Pintura', 'Pintura de interiores e exteriores', 'paint'),
('Eletricidade', 'Serviços elétricos', 'electric'),
('Canalizações', 'Serviços de canalização', 'plumbing')
ON CONFLICT (name) DO NOTHING;

-- Badges
INSERT INTO public.badges (name, description, icon, criteria) VALUES
('Primeiros Passos', 'Completou o primeiro biskate', '🏁', '{"min_reviews": 1}'),
('Super Prestador', 'Manteve média de 4.8 em 10 trabalhos', '⭐', '{"min_reviews": 10, "min_rating": 4.8}'),
('Rápido e Furioso', 'Alta pontualidade', '⚡', '{"min_timeliness": 4.5}')
ON CONFLICT DO NOTHING;

-- Permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

COMMIT;

SELECT 'Master Schema Setup Completed Successfully' as result;

-- Migration to fix missing plan_limits table and data
-- EXECUTAR NO SUPABASE SQL EDITOR

-- 1. Create plan_limits table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.plan_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_tier TEXT NOT NULL UNIQUE,
    user_type TEXT DEFAULT 'provider' CHECK (user_type IN ('provider', 'client', 'both')),
    contact_views_limit INTEGER DEFAULT 0,
    proposals_limit INTEGER DEFAULT 0,
    gig_responses_limit INTEGER DEFAULT 0,
    has_search_boost BOOLEAN DEFAULT false,
    has_profile_highlight BOOLEAN DEFAULT false,
    badge_text TEXT,
    reset_period TEXT DEFAULT 'monthly' CHECK (reset_period IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly')),
    features JSONB DEFAULT '{}'::jsonb,
    price DECIMAL(10, 2) DEFAULT 0,
    currency TEXT DEFAULT 'EUR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Plan limits are viewable by everyone" ON public.plan_limits;
CREATE POLICY "Plan limits are viewable by everyone" ON public.plan_limits
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage plan limits" ON public.plan_limits;
CREATE POLICY "Admins can manage plan limits" ON public.plan_limits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 4. Seed Data (from plans_data.json)
INSERT INTO public.plan_limits (
    id, plan_tier, user_type, contact_views_limit, proposals_limit, gig_responses_limit, 
    has_search_boost, has_profile_highlight, badge_text, reset_period, features, price, currency
) VALUES 
(
    'bb615fbc-7d8a-4880-b43f-87fabeec22dc', 'free', 'provider', 1, 1, 1, 
    false, false, 'FREE', 'weekly', '{"emergency_calls": false, "priority_support": false, "featured_homepage": false}', 0, 'EUR'
),
(
    '6d1a7acf-2227-44b3-b11d-636cb52a2c92', 'essential', 'provider', 60, 30, 30, 
    false, false, 'BASIC', 'biweekly', '{"emergency_calls": false, "priority_support": true, "featured_homepage": false}', 20, 'EUR'
),
(
    '015b346b-60a1-4b01-8118-15d5a3a5e511', 'pro', 'provider', 120, 60, 60, 
    true, true, 'PRO', 'biweekly', '{"analytics": true, "emergency_calls": true, "priority_support": true, "featured_homepage": true}', 40, 'EUR'
),
(
    'eb4ae1c8-61ee-410e-a727-1bc4a86d75fb', 'unlimited', 'provider', 2147483647, 2147483647, 2147483647, 
    true, true, 'VIP', 'monthly', '{"analytics": true, "custom_branding": true, "emergency_calls": true, "priority_support": true, "featured_homepage": true}', 150, 'EUR'
)
ON CONFLICT (plan_tier) DO UPDATE SET
    contact_views_limit = EXCLUDED.contact_views_limit,
    proposals_limit = EXCLUDED.proposals_limit,
    gig_responses_limit = EXCLUDED.gig_responses_limit,
    has_search_boost = EXCLUDED.has_search_boost,
    has_profile_highlight = EXCLUDED.has_profile_highlight,
    badge_text = EXCLUDED.badge_text,
    reset_period = EXCLUDED.reset_period,
    features = EXCLUDED.features,
    price = EXCLUDED.price,
    currency = EXCLUDED.currency,
    updated_at = NOW();

-- 5. Create usage_history table
CREATE TABLE IF NOT EXISTS public.usage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    target_id TEXT,
    target_type TEXT,
    credits_used INTEGER DEFAULT 1,
    plan_tier TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RPC Functions for Quotas
DROP FUNCTION IF EXISTS public.get_user_quotas(UUID);
CREATE OR REPLACE FUNCTION public.get_user_quotas(p_user_id UUID)
RETURNS TABLE (
    plan_tier TEXT,
    contact_views_used INTEGER,
    contact_views_limit INTEGER,
    contact_views_remaining INTEGER,
    proposals_used INTEGER,
    proposals_limit INTEGER,
    proposals_remaining INTEGER,
    gig_responses_used INTEGER,
    gig_responses_limit INTEGER,
    gig_responses_remaining INTEGER,
    next_reset_date TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.plan,
        p.responses_used as contact_views_used,
        l.contact_views_limit,
        GREATEST(0, l.contact_views_limit - COALESCE(p.responses_used, 0)) as contact_views_remaining,
        p.proposals_used,
        l.proposals_limit,
        GREATEST(0, l.proposals_limit - COALESCE(p.proposals_used, 0)) as proposals_remaining,
        p.gig_responses_used,
        l.gig_responses_limit,
        GREATEST(0, l.gig_responses_limit - COALESCE(p.gig_responses_used, 0)) as gig_responses_remaining,
        LEAST(
            COALESCE(p.responses_reset_date, NOW() + INTERVAL '1 month'),
            COALESCE(p.proposals_reset_date, NOW() + INTERVAL '1 month'),
            COALESCE(p.gig_responses_reset_date, NOW() + INTERVAL '1 month')
        ) as next_reset_date
    FROM public.profiles p
    JOIN public.plan_limits l ON p.plan = l.plan_tier
    WHERE p.id = p_user_id;
END;
$$;

DROP FUNCTION IF EXISTS public.reset_user_quotas();
CREATE OR REPLACE FUNCTION public.reset_user_quotas()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.profiles p
    SET 
        responses_used = 0,
        proposals_used = 0,
        gig_responses_used = 0,
        responses_reset_date = CASE 
            WHEN l.reset_period = 'daily' THEN NOW() + INTERVAL '1 day'
            WHEN l.reset_period = 'weekly' THEN NOW() + INTERVAL '1 week'
            WHEN l.reset_period = 'biweekly' THEN NOW() + INTERVAL '2 weeks'
            WHEN l.reset_period = 'yearly' THEN NOW() + INTERVAL '1 year'
            ELSE NOW() + INTERVAL '1 month'
        END,
        proposals_reset_date = CASE 
            WHEN l.reset_period = 'daily' THEN NOW() + INTERVAL '1 day'
            WHEN l.reset_period = 'weekly' THEN NOW() + INTERVAL '1 week'
            WHEN l.reset_period = 'biweekly' THEN NOW() + INTERVAL '2 weeks'
            WHEN l.reset_period = 'yearly' THEN NOW() + INTERVAL '1 year'
            ELSE NOW() + INTERVAL '1 month'
        END,
        gig_responses_reset_date = CASE 
            WHEN l.reset_period = 'daily' THEN NOW() + INTERVAL '1 day'
            WHEN l.reset_period = 'weekly' THEN NOW() + INTERVAL '1 week'
            WHEN l.reset_period = 'biweekly' THEN NOW() + INTERVAL '2 weeks'
            WHEN l.reset_period = 'yearly' THEN NOW() + INTERVAL '1 year'
            ELSE NOW() + INTERVAL '1 month'
        END
    FROM public.plan_limits l
    WHERE p.plan = l.plan_tier
    AND (
        p.responses_reset_date < NOW() OR 
        p.proposals_reset_date < NOW() OR 
        p.gig_responses_reset_date < NOW()
    );
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;

-- 7. RLS for usage_history
ALTER TABLE public.usage_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own usage history" ON public.usage_history;
CREATE POLICY "Users can view their own usage history" ON public.usage_history
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all usage history" ON public.usage_history;
CREATE POLICY "Admins can view all usage history" ON public.usage_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

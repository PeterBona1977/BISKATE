-- Upsert plan limits based on user configuration
-- This ensures the exactly requested values are in the database

-- First, ensure the columns exist (just in case)
ALTER TABLE public.plan_limits ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'provider';
ALTER TABLE public.plan_limits ADD COLUMN IF NOT EXISTS gig_responses_limit INTEGER DEFAULT 0;

-- Upsert the plans
INSERT INTO public.plan_limits (
    plan_tier, 
    user_type, 
    contact_views_limit, 
    proposals_limit, 
    gig_responses_limit, 
    has_search_boost, 
    has_profile_highlight, 
    badge_text, 
    reset_period
)
VALUES 
    ('free', 'provider', 1, 3, 5, false, false, null, 'monthly'),
    ('essential', 'provider', 50, 30, 75, false, false, null, 'monthly'),
    ('pro', 'provider', 150, 100, 250, true, true, 'PRO', 'monthly'),
    ('unlimited', 'provider', 2147483647, 2147483647, 2147483647, true, true, 'VIP', 'monthly')
ON CONFLICT (plan_tier) DO UPDATE SET
    user_type = EXCLUDED.user_type,
    contact_views_limit = EXCLUDED.contact_views_limit,
    proposals_limit = EXCLUDED.proposals_limit,
    gig_responses_limit = EXCLUDED.gig_responses_limit,
    has_search_boost = EXCLUDED.has_search_boost,
    has_profile_highlight = EXCLUDED.has_profile_highlight,
    badge_text = EXCLUDED.badge_text,
    reset_period = EXCLUDED.reset_period,
    updated_at = NOW();

-- Verification
SELECT plan_tier, user_type, contact_views_limit, proposals_limit, badge_text 
FROM public.plan_limits
ORDER BY contact_views_limit ASC;

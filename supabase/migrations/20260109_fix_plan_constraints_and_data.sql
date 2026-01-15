-- Migration to fix plan constraints and ensure data consistency
-- EXECUTAR NO SUPABASE SQL EDITOR

BEGIN;

-- 1. Update profiles table plan check constraint
-- First drop the old one if we can identify it, or just alter the column
-- In Supabase, we usually have to drop and add. 
-- Let's try to find the constraint name or just be generic if possible.
-- Usually it's named profiles_plan_check

DO $$ 
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'essential', 'pro', 'unlimited', 'premium'));
END $$;

-- 2. Ensure plan_limits table entries have correct user_type and names
-- This ensures 'essential' and 'pro' are valid and mapped to 'provider'
INSERT INTO public.plan_limits (
    plan_tier, user_type, contact_views_limit, proposals_limit, gig_responses_limit, 
    has_search_boost, has_profile_highlight, badge_text, reset_period, features, price, currency
) VALUES 
(
    'essential', 'provider', 60, 30, 30, 
    false, false, 'BASIC', 'biweekly', '{"emergency_calls": false, "priority_support": true, "featured_homepage": false}', 20, 'EUR'
),
(
    'pro', 'provider', 120, 60, 60, 
    true, true, 'PRO', 'biweekly', '{"analytics": true, "emergency_calls": true, "priority_support": true, "featured_homepage": true}', 40, 'EUR'
)
ON CONFLICT (plan_tier) DO UPDATE SET
    user_type = 'provider',
    price = EXCLUDED.price,
    features = EXCLUDED.features,
    updated_at = NOW();

-- 3. Update any profiles that might be using the wrong naming convention if necessary
-- For example, if 'premium' was meant to be 'pro'
UPDATE public.profiles SET plan = 'pro' WHERE plan = 'premium';

COMMIT;

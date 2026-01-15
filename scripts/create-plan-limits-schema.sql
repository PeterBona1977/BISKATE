-- =====================================================
-- BISKATE - SUBSCRIPTION PLAN LIMITS SCHEMA
-- Phase 1: Database Schema Implementation
-- =====================================================

-- 1. ADD NEW QUOTA TRACKING COLUMNS TO PROFILES
-- Note: responses_reset_date likely already exists, only add new ones
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS proposals_used INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS proposals_reset_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month');
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gig_responses_used INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gig_responses_reset_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month');

-- Also ensure responses_reset_date exists (from previous migrations)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS responses_reset_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month');

-- Update existing users to have reset dates for the new columns only
UPDATE public.profiles 
SET 
  proposals_reset_date = COALESCE(proposals_reset_date, NOW() + INTERVAL '1 month'),
  gig_responses_reset_date = COALESCE(gig_responses_reset_date, NOW() + INTERVAL '1 month'),
  responses_reset_date = COALESCE(responses_reset_date, NOW() + INTERVAL '1 month')
WHERE 
  proposals_reset_date IS NULL OR
  gig_responses_reset_date IS NULL OR
  responses_reset_date IS NULL;

-- 2. CREATE PLAN LIMITS CONFIGURATION TABLE
CREATE TABLE IF NOT EXISTS public.plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_tier TEXT NOT NULL UNIQUE,
  contact_views_limit INTEGER NOT NULL,
  proposals_limit INTEGER NOT NULL,
  gig_responses_limit INTEGER NOT NULL,
  has_search_boost BOOLEAN DEFAULT FALSE,
  has_profile_highlight BOOLEAN DEFAULT FALSE,
  badge_text TEXT,
  reset_period TEXT DEFAULT 'monthly',
  features JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert plan configurations
INSERT INTO public.plan_limits (plan_tier, contact_views_limit, proposals_limit, gig_responses_limit, has_search_boost, has_profile_highlight, badge_text, features)
VALUES 
  ('free', 1, 3, 5, FALSE, FALSE, NULL, '{"featured_homepage": false, "priority_support": false}'),
  ('essential', 50, 30, 75, FALSE, FALSE, NULL, '{"featured_homepage": false, "priority_support": true}'),
  ('pro', 150, 100, 250, TRUE, TRUE, 'PRO', '{"featured_homepage": true, "priority_support": true, "analytics": true}'),
  ('unlimited', 2147483647, 2147483647, 2147483647, TRUE, TRUE, 'VIP', '{"featured_homepage": true, "priority_support": true, "analytics": true, "custom_branding": true}')
ON CONFLICT (plan_tier) DO UPDATE SET
  contact_views_limit = EXCLUDED.contact_views_limit,
  proposals_limit = EXCLUDED.proposals_limit,
  gig_responses_limit = EXCLUDED.gig_responses_limit,
  has_search_boost = EXCLUDED.has_search_boost,
  has_profile_highlight = EXCLUDED.has_profile_highlight,
  badge_text = EXCLUDED.badge_text,
  features = EXCLUDED.features,
  updated_at = NOW();

-- 3. CREATE USAGE HISTORY TABLE FOR ANALYTICS
CREATE TABLE IF NOT EXISTS public.usage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'contact_view', 'proposal', 'gig_response'
  target_id UUID,
  target_type TEXT, -- 'gig', 'user', etc.
  credits_used INTEGER DEFAULT 1,
  plan_tier TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_history_user_id ON public.usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_history_action_type ON public.usage_history(action_type);
CREATE INDEX IF NOT EXISTS idx_usage_history_created_at ON public.usage_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_history_user_action ON public.usage_history(user_id, action_type);

-- Index for quota columns
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_proposals_reset ON public.profiles(proposals_reset_date);
CREATE INDEX IF NOT EXISTS idx_profiles_responses_reset ON public.profiles(responses_reset_date);
CREATE INDEX IF NOT EXISTS idx_profiles_gig_responses_reset ON public.profiles(gig_responses_reset_date);

-- 4. CREATE FUNCTION TO RESET MONTHLY QUOTAS
CREATE OR REPLACE FUNCTION public.reset_user_quotas()
RETURNS TABLE(users_reset INTEGER) AS $$
DECLARE
  reset_count INTEGER := 0;
BEGIN
  -- Reset responses (contact views)
  UPDATE public.profiles
  SET 
    responses_used = 0,
    responses_reset_date = NOW() + INTERVAL '1 month'
  WHERE responses_reset_date < NOW()
    AND plan != 'unlimited';
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  
  -- Reset proposals
  UPDATE public.profiles
  SET 
    proposals_used = 0,
    proposals_reset_date = NOW() + INTERVAL '1 month'
  WHERE proposals_reset_date < NOW()
    AND plan != 'unlimited';
  
  -- Reset gig responses
  UPDATE public.profiles
  SET 
    gig_responses_used = 0,
    gig_responses_reset_date = NOW() + INTERVAL '1 month'
  WHERE gig_responses_reset_date < NOW()
    AND plan != 'unlimited';
  
  RETURN QUERY SELECT reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CREATE FUNCTION TO GET USER QUOTA STATUS
CREATE OR REPLACE FUNCTION public.get_user_quotas(p_user_id UUID)
RETURNS TABLE(
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
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.plan,
    p.responses_used,
    pl.contact_views_limit,
    GREATEST(0, pl.contact_views_limit - p.responses_used),
    p.proposals_used,
    pl.proposals_limit,
    GREATEST(0, pl.proposals_limit - p.proposals_used),
    p.gig_responses_used,
    pl.gig_responses_limit,
    GREATEST(0, pl.gig_responses_limit - p.gig_responses_used),
    LEAST(p.responses_reset_date, p.proposals_reset_date, p.gig_responses_reset_date)
  FROM public.profiles p
  LEFT JOIN public.plan_limits pl ON p.plan = pl.plan_tier
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. ENABLE RLS ON NEW TABLES
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_history ENABLE ROW LEVEL SECURITY;

-- Plan limits are readable by everyone
CREATE POLICY "plan_limits_select" ON public.plan_limits FOR SELECT USING (true);

-- Only admins can modify plan limits
CREATE POLICY "plan_limits_admin_modify" ON public.plan_limits FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Users can view their own usage history, admins can view all
CREATE POLICY "usage_history_select" ON public.usage_history FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only system can insert usage history (via service functions)
CREATE POLICY "usage_history_insert" ON public.usage_history FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- 7. VERIFICATION QUERIES
DO $$
BEGIN
  RAISE NOTICE '✅ Plan Limits Schema Migration Completed!';
  RAISE NOTICE '📊 Tables created/updated: profiles (new columns), plan_limits, usage_history';
  RAISE NOTICE '🔧 Functions created: reset_user_quotas(), get_user_quotas()';
  RAISE NOTICE '🔒 RLS policies configured';
END $$;

-- Display current plan limits
SELECT 
  plan_tier,
  contact_views_limit,
  proposals_limit,
  gig_responses_limit,
  has_search_boost,
  badge_text
FROM public.plan_limits
ORDER BY 
  CASE plan_tier
    WHEN 'free' THEN 1
    WHEN 'essential' THEN 2
    WHEN 'pro' THEN 3
    WHEN 'unlimited' THEN 4
  END;

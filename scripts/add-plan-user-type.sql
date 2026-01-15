-- Add user_type field to plan_limits table
-- This defines whether a plan is for providers, clients, or both

ALTER TABLE public.plan_limits 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'provider' 
CHECK (user_type IN ('provider', 'client', 'both'));

-- Update existing plans to be provider-specific
UPDATE public.plan_limits 
SET user_type = 'provider'
WHERE user_type IS NULL;

-- Add comment to column
COMMENT ON COLUMN public.plan_limits.user_type IS 'Defines if plan is for providers (service providers), clients (gig posters), or both';

-- Verification
SELECT plan_tier, user_type, contact_views_limit, proposals_limit, badge_text
FROM public.plan_limits
ORDER BY plan_tier;

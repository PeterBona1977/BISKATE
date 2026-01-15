-- =====================================================
-- BISKATE - ADD PRICE TO PLAN LIMITS
-- =====================================================

-- Add price and currency columns to plan_limits
ALTER TABLE public.plan_limits 
ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';

-- Add comment
COMMENT ON COLUMN public.plan_limits.price IS 'Display price for the plan';
COMMENT ON COLUMN public.plan_limits.currency IS 'Currency code (EUR, USD, etc)';

-- Verification
SELECT plan_tier, price, currency FROM public.plan_limits;

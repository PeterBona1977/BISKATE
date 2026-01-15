-- =====================================================
-- BISKATE - UPDATE PLAN PERIODICITY
-- =====================================================

-- 1. Ensure reset_period exists and add optional interval_count if needed
-- For simplicity, we can use reset_period to store standard interval strings like '1 week', '2 weeks', '1 month', '1 year'
-- but let's check if we want to separate them.
-- To stay compatible with what we saw in the schema:
-- we will use reset_period values: 'weekly', 'biweekly', 'monthly', 'yearly'

-- Update existing plans to have 'monthly' as default if not set
UPDATE public.plan_limits SET reset_period = 'monthly' WHERE reset_period IS NULL;

-- 2. UPDATE reset_user_quotas function to be dynamic
CREATE OR REPLACE FUNCTION public.reset_user_quotas()
RETURNS TABLE(users_reset INTEGER) AS $$
DECLARE
  reset_count INTEGER := 0;
  total_reset INTEGER := 0;
BEGIN
  -- We need to update user quotas based on their plan's reset_period
  -- We'll do it in a single update join or separate updates for each period for clarity
  
  -- The core issue is calculating the NEXT reset date based on the plan's period.
  
  UPDATE public.profiles p
  SET 
    responses_used = CASE WHEN p.responses_reset_date < NOW() THEN 0 ELSE p.responses_used END,
    proposals_used = CASE WHEN p.proposals_reset_date < NOW() THEN 0 ELSE p.proposals_used END,
    gig_responses_used = CASE WHEN p.gig_responses_reset_date < NOW() THEN 0 ELSE p.gig_responses_used END,
    
    responses_reset_date = CASE 
      WHEN p.responses_reset_date < NOW() THEN 
        CASE pl.reset_period
          WHEN 'weekly' THEN NOW() + INTERVAL '1 week'
          WHEN 'biweekly' THEN NOW() + INTERVAL '2 weeks'
          WHEN 'yearly' THEN NOW() + INTERVAL '1 year'
          ELSE NOW() + INTERVAL '1 month'
        END
      ELSE p.responses_reset_date 
    END,
    
    proposals_reset_date = CASE 
      WHEN p.proposals_reset_date < NOW() THEN 
        CASE pl.reset_period
          WHEN 'weekly' THEN NOW() + INTERVAL '1 week'
          WHEN 'biweekly' THEN NOW() + INTERVAL '2 weeks'
          WHEN 'yearly' THEN NOW() + INTERVAL '1 year'
          ELSE NOW() + INTERVAL '1 month'
        END
      ELSE p.proposals_reset_date 
    END,
    
    gig_responses_reset_date = CASE 
      WHEN p.gig_responses_reset_date < NOW() THEN 
        CASE pl.reset_period
          WHEN 'weekly' THEN NOW() + INTERVAL '1 week'
          WHEN 'biweekly' THEN NOW() + INTERVAL '2 weeks'
          WHEN 'yearly' THEN NOW() + INTERVAL '1 year'
          ELSE NOW() + INTERVAL '1 month'
        END
      ELSE p.gig_responses_reset_date 
    END
  FROM public.plan_limits pl
  WHERE p.plan = pl.plan_tier
    AND (p.responses_reset_date < NOW() OR p.proposals_reset_date < NOW() OR p.gig_responses_reset_date < NOW())
    AND p.plan != 'unlimited';

  GET DIAGNOSTICS total_reset = ROW_COUNT;
  
  RETURN QUERY SELECT total_reset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

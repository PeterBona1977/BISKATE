-- =====================================================
-- BISKATE - ADD DAILY PERIODICITY
-- =====================================================

-- Update reset_user_quotas function to include 'daily' option
CREATE OR REPLACE FUNCTION public.reset_user_quotas()
RETURNS TABLE(users_reset INTEGER) AS $$
DECLARE
  reset_count INTEGER := 0;
  total_reset INTEGER := 0;
BEGIN
  UPDATE public.profiles p
  SET 
    responses_used = CASE WHEN p.responses_reset_date < NOW() THEN 0 ELSE p.responses_used END,
    proposals_used = CASE WHEN p.proposals_reset_date < NOW() THEN 0 ELSE p.proposals_used END,
    gig_responses_used = CASE WHEN p.gig_responses_reset_date < NOW() THEN 0 ELSE p.gig_responses_used END,
    
    responses_reset_date = CASE 
      WHEN p.responses_reset_date < NOW() THEN 
        CASE pl.reset_period
          WHEN 'daily' THEN NOW() + INTERVAL '1 day'
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
          WHEN 'daily' THEN NOW() + INTERVAL '1 day'
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
          WHEN 'daily' THEN NOW() + INTERVAL '1 day'
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

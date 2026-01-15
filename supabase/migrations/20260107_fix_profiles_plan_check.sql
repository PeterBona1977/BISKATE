-- Migration to fix profiles_plan_check constraint
DO $$ 
BEGIN 
    -- Drop existing constraint if it exists
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
    
    -- Add updated constraint with correct plan tiers
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check 
        CHECK (plan IN ('free', 'essential', 'pro', 'unlimited'));
END $$;

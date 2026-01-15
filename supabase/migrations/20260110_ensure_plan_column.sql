-- Ensure plan column exists in profiles table AND has Foreign Key
-- EXECUTAR NO SUPABASE SQL EDITOR

DO $$ 
BEGIN
    -- 1. Ensure column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'plan') THEN
        ALTER TABLE public.profiles ADD COLUMN plan TEXT DEFAULT 'free';
    END IF;

    -- 2. Update existing NULL plans to 'free'
    UPDATE public.profiles SET plan = 'free' WHERE plan IS NULL;

    -- 3. Add Check Constraint
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'essential', 'pro', 'unlimited', 'premium'));

    -- 4. Add Foreign Key to plan_limits (This fixes the join error)
    -- First drop if exists to be safe
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_fkey;
    
    -- We need to ensure plan_limits exists and has unique plan_tier. 
    -- plan_limits PK is usually id, but plan_tier should be unique.
    -- Assuming plan_limits(plan_tier) is unique/PK.
    
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_plan_fkey 
    FOREIGN KEY (plan) 
    REFERENCES public.plan_limits(plan_tier);

END $$;

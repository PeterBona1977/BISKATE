-- Identify the current check constraint name (usually profiles_role_check)
-- and update it to include 'provider_pending' and 'provider'

DO $$
BEGIN
    -- Drop the existing constraint if it exists
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    
    -- Add the updated constraint
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('client', 'provider', 'provider_pending', 'admin', 'super_admin', 'user'));
END $$;

-- Verify the change
SELECT 
    conname as constraint_name, 
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass 
AND contype = 'c';

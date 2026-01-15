-- Force assignment of 'user_registered' trigger to the Verification Email template
-- This fixes the issue where "No active template found" error appears.

-- 1. First, clear the trigger if it's assigned to the wrong template
UPDATE public.email_templates 
SET trigger_key = NULL 
WHERE trigger_key = 'user_registered';

-- 2. Assign it to the correct template
-- We search for slug 'email-verification' OR any template with 'verification' in the slug
UPDATE public.email_templates 
SET trigger_key = 'user_registered'
WHERE id = (
    SELECT id FROM public.email_templates 
    WHERE slug = 'email-verification' 
    OR (slug LIKE '%verif%' AND trigger_key IS NULL)
    LIMIT 1
);

-- 3. Verify it was assigned
DO $$
DECLARE
    found_slug text;
BEGIN
    SELECT slug INTO found_slug FROM public.email_templates WHERE trigger_key = 'user_registered';
    IF found_slug IS NULL THEN
        RAISE NOTICE 'WARNING: Could not find a suitable Verification template to assign!';
    ELSE
        RAISE NOTICE 'SUCCESS: Assigned "user_registered" trigger to template: %', found_slug;
    END IF;
END $$;

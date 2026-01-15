-- Insert a default Verification Email template if one is missing for 'user_registered'
-- This guarantees the system has a template to send.

DO $$
BEGIN
    -- Only insert if NO template is currently assigned to 'user_registered'
    IF NOT EXISTS (SELECT 1 FROM public.email_templates WHERE trigger_key = 'user_registered') THEN
        
        INSERT INTO public.email_templates (
            name, 
            slug, 
            subject, 
            body, 
            trigger_key, 
            is_active
        ) VALUES (
            'Verification Email (System Default)',
            'verification-email-system-default',
            'Verify your GigHub account',
            '<h1>Welcome to GigHub!</h1><p>Please verify your email to get started.</p><p><a href="{{verification_link}}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p><p>Or click here: {{verification_link}}</p>',
            'user_registered',
            true
        );
        
        RAISE NOTICE 'SUCCESS: Created new Verification Email template.';
    ELSE
        RAISE NOTICE 'INFO: A template for "user_registered" already exists (weird, but okay).';
    END IF;
END $$;

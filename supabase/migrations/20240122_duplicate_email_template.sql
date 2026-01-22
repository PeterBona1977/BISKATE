-- Duplicate the user_registered email template for company_registered
-- This ensures the company welcome email looks exactly like the individual one

INSERT INTO email_templates (slug, subject, body, active)
SELECT 
    'company_registered', -- New trigger/slug
    subject,              -- Same subject (or you can modify it here e.g., 'Bem-vindo à GigHub - Empresa')
    body,                 -- Same HTML body
    true
FROM email_templates
WHERE slug = 'user_registered'
AND NOT EXISTS (
    SELECT 1 FROM email_templates WHERE slug = 'company_registered'
);

-- Note: If you want a specific subject for companies but same body:
-- UPDATE email_templates 
-- SET subject = 'Bem-vindo ao GigHub - Empresa' 
-- WHERE slug = 'company_registered';

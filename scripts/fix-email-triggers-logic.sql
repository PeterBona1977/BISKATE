-- Fix duplicate key error and adjust logic
-- Logic: Register -> Verification Email | Verify -> Welcome Email

-- 1. Temporarily clear all conflicting triggers to avoid unique constraint errors
update public.email_templates set trigger_key = null 
where trigger_key in ('user_registered', 'email_verified', 'email_verification');

-- 2. Map "Verification Email" to "user_registered" trigger (Sent when user registers)
-- This assumes standard template slug 'email-verification'. If different, user might need to adjust.
update public.email_templates 
set trigger_key = 'user_registered' 
where slug = 'email-verification';

-- 3. Map "Welcome Email" to "email_verified" trigger (Sent when email is verified)
-- This assumes standard template slug 'welcome'.
update public.email_templates 
set trigger_key = 'email_verified' 
where slug = 'welcome';

-- 4. Ensure other standard triggers are set (restoring from previous if needed)
update public.email_templates set trigger_key = 'password_reset' where slug = 'password-reset' and trigger_key is null;
update public.email_templates set trigger_key = 'new_message' where slug = 'new-message' and trigger_key is null;
update public.email_templates set trigger_key = 'payment_received' where slug = 'payment-received' and trigger_key is null;

-- Migration to enable notification settings by default
ALTER TABLE public.user_notification_preferences 
ALTER COLUMN push_notifications SET DEFAULT true,
ALTER COLUMN email_notifications SET DEFAULT true,
ALTER COLUMN gig_created SET DEFAULT true,
ALTER COLUMN gig_approved SET DEFAULT true,
ALTER COLUMN gig_rejected SET DEFAULT true,
ALTER COLUMN response_received SET DEFAULT true,
ALTER COLUMN response_accepted SET DEFAULT true,
ALTER COLUMN contact_viewed SET DEFAULT true,
ALTER COLUMN marketing_emails SET DEFAULT true;

-- Backfill existing users (already handled by script, but good for completeness)
UPDATE public.user_notification_preferences
SET 
  push_notifications = COALESCE(push_notifications, true),
  email_notifications = COALESCE(email_notifications, true),
  gig_created = COALESCE(gig_created, true),
  gig_approved = COALESCE(gig_approved, true),
  gig_rejected = COALESCE(gig_rejected, true),
  response_received = COALESCE(response_received, true),
  response_accepted = COALESCE(response_accepted, true),
  contact_viewed = COALESCE(contact_viewed, true),
  marketing_emails = COALESCE(marketing_emails, true);

-- Add user_type column to notifications table
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_type TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON public.notifications(user_type);

-- Backfill existing notifications based on title/message (optional but helpful)
UPDATE public.notifications SET user_type = 'client' WHERE title ILIKE '%biskate%' AND user_type IS NULL;
UPDATE public.notifications SET user_type = 'provider' WHERE (title ILIKE '%proposta%' OR title ILIKE '%inscrição%') AND user_type IS NULL;
UPDATE public.notifications SET user_type = 'admin' WHERE type = 'admin_alert' AND user_type IS NULL;

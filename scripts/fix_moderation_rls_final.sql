
-- Enable RLS (just in case)
ALTER TABLE public.moderation_alerts ENABLE ROW LEVEL SECURITY;

-- DROP existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all alerts" ON public.moderation_alerts;
DROP POLICY IF EXISTS "Admins can update alerts" ON public.moderation_alerts;
DROP POLICY IF EXISTS "Admins can delete alerts" ON public.moderation_alerts;
DROP POLICY IF EXISTS "Authenticated users can insert alerts" ON public.moderation_alerts;

-- Policy: Admins can view all alerts
CREATE POLICY "Admins can view all alerts"
ON public.moderation_alerts
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- Policy: Admins can update alerts
CREATE POLICY "Admins can update alerts"
ON public.moderation_alerts
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- Policy: Admins can delete alerts
CREATE POLICY "Admins can delete alerts"
ON public.moderation_alerts
FOR DELETE
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- Policy: Any authenticated user can INSERT alerts (to report content)
CREATE POLICY "Authenticated users can insert alerts"
ON public.moderation_alerts
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
);

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'moderation_alerts';

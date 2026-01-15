
-- 1. FIX PROFILES RLS
-- Crucial: policies often block the "Check if Admin" subquery if profiles aren't readable!

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Allow everyone to read profiles (needed for the admin check subquery to work for other users)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Allow insert/update for own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);


-- 2. FIX MODERATION ALERTS RLS
ALTER TABLE public.moderation_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all alerts" ON public.moderation_alerts;
DROP POLICY IF EXISTS "Admins can update alerts" ON public.moderation_alerts;
DROP POLICY IF EXISTS "Admins can delete alerts" ON public.moderation_alerts;
DROP POLICY IF EXISTS "Authenticated users can insert alerts" ON public.moderation_alerts;

-- Using a simpler admin check that relies on the profiles policy above being active
CREATE POLICY "Admins can view all alerts"
ON public.moderation_alerts
FOR SELECT
USING (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update alerts"
ON public.moderation_alerts
FOR UPDATE
USING (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete alerts"
ON public.moderation_alerts
FOR DELETE
USING (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

CREATE POLICY "Authenticated users can insert alerts"
ON public.moderation_alerts
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');


-- 3. ENSURE DATA EXISTS
INSERT INTO public.moderation_alerts (
  type, severity, status, target_type, target_id, description, metadata
)
SELECT 
  'spam', 'high', 'pending', 'gig', '711d0fa6-c228-430e-823d-9114802030e5', 'Venda de itens proibidos (Manual Safety Insert)', '{"source": "final_fix"}'
WHERE NOT EXISTS (SELECT 1 FROM public.moderation_alerts LIMIT 1);

-- Migration to resolve Supabase Advisor security errors
-- 1. Fix security_definer_view for reputation_stats
-- We drop and recreate the view with security_invoker = true
DROP VIEW IF EXISTS public.reputation_stats;
CREATE VIEW public.reputation_stats 
WITH (security_invoker = true)
AS
SELECT
  reviewee_id as user_id,
  COUNT(*) as total_reviews_received,
  COALESCE(AVG(rating), 0) as average_rating,
  COALESCE(AVG(communication_rating), 0) as avg_communication,
  COALESCE(AVG(quality_rating), 0) as avg_quality,
  COALESCE(AVG(timeliness_rating), 0) as avg_timeliness,
  COALESCE(AVG(professionalism_rating), 0) as avg_professionalism
FROM public.reviews
WHERE status = 'approved'
GROUP BY reviewee_id;

-- 2. Enable RLS on public tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Implement RLS Policies

-- CATEGORIES
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone" ON public.categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- REVIEWS
DROP POLICY IF EXISTS "Approved reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Approved reviews are viewable by everyone" ON public.reviews
    FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Users can view their own reviews (even if not approved)" ON public.reviews;
CREATE POLICY "Users can view their own reviews (even if not approved)" ON public.reviews
    FOR SELECT USING (auth.uid() = reviewer_id OR auth.uid() = reviewee_id);

DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
CREATE POLICY "Users can insert their own reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
CREATE POLICY "Admins can manage all reviews" ON public.reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- BADGES
DROP POLICY IF EXISTS "Badges are viewable by everyone" ON public.badges;
CREATE POLICY "Badges are viewable by everyone" ON public.badges
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage badges" ON public.badges;
CREATE POLICY "Admins can manage badges" ON public.badges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- USER_BADGES
DROP POLICY IF EXISTS "User badges are viewable by everyone" ON public.user_badges;
CREATE POLICY "User badges are viewable by everyone" ON public.user_badges
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage user badges" ON public.user_badges;
CREATE POLICY "Admins can manage user badges" ON public.user_badges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- GIGS
DROP POLICY IF EXISTS "Active gigs are viewable by everyone" ON public.gigs;
CREATE POLICY "Active gigs are viewable by everyone" ON public.gigs
    FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Users can view their own gigs" ON public.gigs;
CREATE POLICY "Users can view their own gigs" ON public.gigs
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can insert their own gigs" ON public.gigs;
CREATE POLICY "Users can insert their own gigs" ON public.gigs
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update their own gigs" ON public.gigs;
CREATE POLICY "Users can update their own gigs" ON public.gigs
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = author_id);

DROP POLICY IF EXISTS "Admins can manage all gigs" ON public.gigs;
CREATE POLICY "Admins can manage all gigs" ON public.gigs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- REVIEW_REPORTS
DROP POLICY IF EXISTS "Users can report reviews" ON public.review_reports;
CREATE POLICY "Users can report reviews" ON public.review_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Reporters can view their own reports" ON public.review_reports;
CREATE POLICY "Reporters can view their own reports" ON public.review_reports
    FOR SELECT USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can manage all reports" ON public.review_reports;
CREATE POLICY "Admins can manage all reports" ON public.review_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;
CREATE POLICY "Admins can manage all notifications" ON public.notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

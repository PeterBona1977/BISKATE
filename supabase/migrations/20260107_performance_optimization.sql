-- Migration for Performance Optimization
-- Adding missing indexes for foreign keys to improve join performance

-- CATEGORIES
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- CMS MEDIA
CREATE INDEX IF NOT EXISTS idx_cms_media_uploaded_by ON public.cms_media(uploaded_by);

-- CMS PAGES
CREATE INDEX IF NOT EXISTS idx_cms_pages_created_by ON public.cms_pages(created_by);
CREATE INDEX IF NOT EXISTS idx_cms_pages_updated_by ON public.cms_pages(updated_by);

-- CONVERSATIONS
CREATE INDEX IF NOT EXISTS idx_conversations_gig_id ON public.conversations(gig_id);

-- GIGS
CREATE INDEX IF NOT EXISTS idx_gigs_author_id ON public.gigs(author_id);
CREATE INDEX IF NOT EXISTS idx_gigs_user_id ON public.gigs(user_id);

-- MODERATION ACTIONS
CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator_id ON public.moderation_actions(moderator_id);

-- MODERATION ALERTS
CREATE INDEX IF NOT EXISTS idx_moderation_alerts_reporter_id ON public.moderation_alerts(reporter_id);
CREATE INDEX IF NOT EXISTS idx_moderation_alerts_resolved_by ON public.moderation_alerts(resolved_by);

-- NOTIFICATIONS
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- PLATFORM INTEGRATIONS
CREATE INDEX IF NOT EXISTS idx_platform_integrations_created_by ON public.platform_integrations(created_by);
CREATE INDEX IF NOT EXISTS idx_platform_integrations_updated_by ON public.platform_integrations(updated_by);

-- PORTFOLIO ITEMS
CREATE INDEX IF NOT EXISTS idx_portfolio_items_provider_id ON public.portfolio_items(provider_id);

-- PROVIDER DOCUMENTS
CREATE INDEX IF NOT EXISTS idx_provider_documents_provider_id ON public.provider_documents(provider_id);

-- REVIEW REPORTS
CREATE INDEX IF NOT EXISTS idx_review_reports_reporter_id ON public.review_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON public.review_reports(review_id);

-- REVIEWS
CREATE INDEX IF NOT EXISTS idx_reviews_gig_id ON public.reviews(gig_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);

-- USER BADGES
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);

-- USER FEEDBACK
CREATE INDEX IF NOT EXISTS idx_user_feedback_assigned_to ON public.user_feedback(assigned_to);
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON public.user_feedback(user_id);

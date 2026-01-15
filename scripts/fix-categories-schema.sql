-- Fix categories schema
-- Run this in Supabase SQL Editor

BEGIN;

-- 1. Add missing columns
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id),
ADD COLUMN IF NOT EXISTS margin_percentage DECIMAL(10,2) DEFAULT 10,
ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Rename active to is_active if it exists, otherwise add is_active
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'active') THEN
        ALTER TABLE public.categories RENAME COLUMN active TO is_active;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'is_active') THEN
        ALTER TABLE public.categories ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 3. Populate slugs for existing categories if they are null
UPDATE public.categories 
SET slug = lower(regexp_replace(name, '\s+', '-', 'g')) 
WHERE slug IS NULL;

-- 4. Add unique constraint to slug
ALTER TABLE public.categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);

COMMIT;

SELECT 'Categories schema fixed successfully' as result;

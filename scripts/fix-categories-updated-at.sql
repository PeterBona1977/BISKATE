-- Add updated_at to categories
-- Run this in Supabase SQL Editor

ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

SELECT 'Added updated_at to categories' as result;

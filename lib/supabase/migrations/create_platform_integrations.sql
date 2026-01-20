-- Create platform_integrations table for storing system settings and integrations
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS platform_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL UNIQUE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE platform_integrations IS 'Stores system settings and third-party integration configs';

-- Enable RLS
ALTER TABLE platform_integrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure idempotency
DROP POLICY IF EXISTS "Admins can view integrations" ON platform_integrations;
DROP POLICY IF EXISTS "Admins can manage integrations" ON platform_integrations;

-- Create policies (Admin only)
CREATE POLICY "Admins can view integrations" ON platform_integrations
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can manage integrations" ON platform_integrations
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Add is_emergency column to provider_services table

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_services' AND column_name = 'is_emergency') THEN
        ALTER TABLE provider_services ADD COLUMN is_emergency BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

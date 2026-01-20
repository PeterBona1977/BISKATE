-- Add service_radius_km and performs_emergency_services to profiles if they don't exist

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'service_radius_km') THEN
        ALTER TABLE profiles ADD COLUMN service_radius_km INTEGER DEFAULT 30;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'performs_emergency_services') THEN
        ALTER TABLE profiles ADD COLUMN performs_emergency_services BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Also ensure postal_code column exists if we are switching from generic location
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'postal_code') THEN
        ALTER TABLE profiles ADD COLUMN postal_code TEXT;
    END IF;

     -- Ensure country_code exists for phone structure if needed, though we might just concatenate
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_country_code') THEN
        ALTER TABLE profiles ADD COLUMN phone_country_code TEXT DEFAULT '+351';
    END IF;
END $$;

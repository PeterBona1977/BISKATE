-- Add is_online and last_active columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing rows to have default values if needed (though defaults handle it for new inserts)
UPDATE profiles SET is_online = FALSE WHERE is_online IS NULL;
UPDATE profiles SET last_active = NOW() WHERE last_active IS NULL;


-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_role TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add index for filtering
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_role ON activity_logs(user_role);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admins can view all logs
CREATE POLICY "Admins can view all logs" ON activity_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
            AND public.profiles.role = 'admin'
        )
    );

-- Users can potentially view their own logs if needed (optional, keeping strict for now)
-- (No policy for users to see their own logs yet, to keep it admin-only mostly)

-- Insert policy (Server-side/Service role mostly, or authenticated users triggering actions)
CREATE POLICY "Authenticated users can insert logs" ON activity_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create platform_integrations table
CREATE TABLE IF NOT EXISTS public.platform_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_name TEXT NOT NULL UNIQUE,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_device_tokens table
CREATE TABLE IF NOT EXISTS public.user_device_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    device_info JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, token)
);

-- Enable RLS
ALTER TABLE public.platform_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_device_tokens ENABLE ROW LEVEL SECURITY;

-- Policies for platform_integrations
-- Admins can do everything
CREATE POLICY "Admins can manage integrations" 
ON public.platform_integrations 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Authenticated users can view enabled integrations (needed for client-side config like Firebase public keys)
-- Note: Sensitive keys (like serverKey) should ideally be filtered out or stored separately, 
-- but for now we follow the existing pattern required by the application code.
CREATE POLICY "Everyone can view enabled integrations" 
ON public.platform_integrations FOR SELECT 
USING (is_enabled = true);

-- Policies for user_device_tokens
CREATE POLICY "Users can view their own tokens" 
ON public.user_device_tokens FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens" 
ON public.user_device_tokens FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens" 
ON public.user_device_tokens FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens" 
ON public.user_device_tokens FOR DELETE 
USING (auth.uid() = user_id);

-- Admins can view all tokens
CREATE POLICY "Admins can view all tokens" 
ON public.user_device_tokens FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

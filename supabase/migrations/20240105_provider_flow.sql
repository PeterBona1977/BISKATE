-- Create portfolio_items table
CREATE TABLE IF NOT EXISTS public.portfolio_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for portfolio_items
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure idempotency
DROP POLICY IF EXISTS "Portfolio items are viewable by everyone" ON public.portfolio_items;
DROP POLICY IF EXISTS "Users can insert their own portfolio items" ON public.portfolio_items;
DROP POLICY IF EXISTS "Users can update their own portfolio items" ON public.portfolio_items;
DROP POLICY IF EXISTS "Users can delete their own portfolio items" ON public.portfolio_items;

-- Create policies for portfolio_items
CREATE POLICY "Portfolio items are viewable by everyone" 
ON public.portfolio_items FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own portfolio items" 
ON public.portfolio_items FOR INSERT 
WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Users can update their own portfolio items" 
ON public.portfolio_items FOR UPDATE 
USING (auth.uid() = provider_id);

CREATE POLICY "Users can delete their own portfolio items" 
ON public.portfolio_items FOR DELETE 
USING (auth.uid() = provider_id);

-- Create provider_documents table
CREATE TABLE IF NOT EXISTS public.provider_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('id', 'certificate', 'insurance')),
    document_name TEXT NOT NULL,
    document_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for provider_documents
ALTER TABLE public.provider_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for documents
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.provider_documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON public.provider_documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON public.provider_documents;
DROP POLICY IF EXISTS "Admins can update documents" ON public.provider_documents;

-- Create policies for provider_documents
CREATE POLICY "Users can insert their own documents" 
ON public.provider_documents FOR INSERT 
WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Users can view their own documents" 
ON public.provider_documents FOR SELECT 
USING (auth.uid() = provider_id);

CREATE POLICY "Admins can view all documents" 
ON public.provider_documents FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update documents" 
ON public.provider_documents FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Add phone_verified column to profiles if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN phone_verified BOOLEAN DEFAULT false;
    END IF;
END $$;

-- CORREÇÃO CRÍTICA: Adicionar coluna user_id à tabela notifications
-- Versão corrigida sem RAISE NOTICE para compatibilidade com Supabase SQL Editor

-- 1. Verificar se a tabela notifications existe, se não, criar
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Adicionar coluna read se não existir (para resolver o erro 42703)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND table_schema = 'public' 
        AND column_name = 'read'
    ) THEN
        ALTER TABLE public.notifications 
        ADD COLUMN read boolean DEFAULT false;
    END IF;
END $$;

-- 3. Adicionar coluna user_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND table_schema = 'public' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.notifications 
        ADD COLUMN user_id uuid;
    END IF;
END $$;

-- 4. Adicionar foreign key constraint se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_notifications_user_id' 
        AND table_name = 'notifications'
    ) THEN
        -- Adicionar foreign key para auth.users
        ALTER TABLE public.notifications
        ADD CONSTRAINT fk_notifications_user_id
        FOREIGN KEY (user_id) REFERENCES auth.users (id)
        ON DELETE CASCADE;
    END IF;
EXCEPTION
    -- Capturar erros de foreign key (caso auth.users não esteja acessível)
    WHEN others THEN
        -- Continuar sem a foreign key
END $$;

-- 5. Criar índices para performance (IF NOT EXISTS evita erros)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON public.notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON public.notifications (user_id, read);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON public.notifications (created_at DESC);

-- 6. Habilitar RLS se não estiver habilitado
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 7. Verificar estrutura final (sem RAISE NOTICE)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

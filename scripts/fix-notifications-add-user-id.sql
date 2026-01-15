-- CORREÇÃO CRÍTICA: Adicionar coluna user_id à tabela notifications
-- Este script é seguro e pode ser executado mesmo se a coluna já existir

-- 1. Verificar se a tabela notifications existe, se não, criar
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Adicionar coluna user_id se não existir
DO $$ 
BEGIN
    -- Verificar se a coluna user_id já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND table_schema = 'public' 
        AND column_name = 'user_id'
    ) THEN
        -- Adicionar a coluna user_id
        ALTER TABLE public.notifications 
        ADD COLUMN user_id uuid;
        
        RAISE NOTICE '✅ Coluna user_id adicionada à tabela notifications';
    ELSE
        RAISE NOTICE '⚠️ Coluna user_id já existe na tabela notifications';
    END IF;
END $$;

-- 3. Adicionar foreign key constraint se não existir
DO $$
BEGIN
    -- Verificar se a foreign key já existe
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
        
        RAISE NOTICE '✅ Foreign key constraint adicionada';
    ELSE
        RAISE NOTICE '⚠️ Foreign key constraint já existe';
    END IF;
END $$;

-- 4. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON public.notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON public.notifications (user_id, read);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON public.notifications (created_at DESC);

-- 5. Habilitar RLS se não estiver habilitado
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 6. Verificar estrutura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

RAISE NOTICE '✅ Estrutura da tabela notifications corrigida com sucesso!';

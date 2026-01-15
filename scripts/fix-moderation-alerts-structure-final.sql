-- Criar a tabela moderation_alerts se não existir
CREATE TABLE IF NOT EXISTS public.moderation_alerts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    gig_id uuid,
    user_id uuid,
    reporter_id uuid,
    type varchar(50) NOT NULL DEFAULT 'content_review',
    severity varchar(20) NOT NULL DEFAULT 'medium',
    status varchar(20) NOT NULL DEFAULT 'pending',
    title varchar(255) NOT NULL,
    description text,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    resolved_by uuid,
    resolution_notes text
);

-- Adicionar foreign keys se não existirem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'moderation_alerts_gig_id_fkey'
    ) THEN
        ALTER TABLE public.moderation_alerts 
        ADD CONSTRAINT moderation_alerts_gig_id_fkey 
        FOREIGN KEY (gig_id) REFERENCES public.gigs(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'moderation_alerts_user_id_fkey'
    ) THEN
        ALTER TABLE public.moderation_alerts 
        ADD CONSTRAINT moderation_alerts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'moderation_alerts_reporter_id_fkey'
    ) THEN
        ALTER TABLE public.moderation_alerts 
        ADD CONSTRAINT moderation_alerts_reporter_id_fkey 
        FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'moderation_alerts_resolved_by_fkey'
    ) THEN
        ALTER TABLE public.moderation_alerts 
        ADD CONSTRAINT moderation_alerts_resolved_by_fkey 
        FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_moderation_alerts_gig_id ON public.moderation_alerts(gig_id);
CREATE INDEX IF NOT EXISTS idx_moderation_alerts_user_id ON public.moderation_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_alerts_status ON public.moderation_alerts(status);
CREATE INDEX IF NOT EXISTS idx_moderation_alerts_type ON public.moderation_alerts(type);
CREATE INDEX IF NOT EXISTS idx_moderation_alerts_created_at ON public.moderation_alerts(created_at);

-- Habilitar RLS
ALTER TABLE public.moderation_alerts ENABLE ROW LEVEL SECURITY;

-- Inserir dados de teste se a tabela estiver vazia
INSERT INTO public.moderation_alerts (title, description, type, severity, status)
SELECT 
    'Alerta de Teste 1',
    'Este é um alerta de moderação de teste',
    'content_review',
    'low',
    'pending'
WHERE NOT EXISTS (SELECT 1 FROM public.moderation_alerts)
UNION ALL
SELECT 
    'Alerta de Teste 2',
    'Este é outro alerta de moderação de teste',
    'spam_report',
    'medium',
    'pending'
WHERE NOT EXISTS (SELECT 1 FROM public.moderation_alerts)
UNION ALL
SELECT 
    'Alerta de Teste 3',
    'Este é um terceiro alerta de moderação de teste',
    'inappropriate_content',
    'high',
    'pending'
WHERE NOT EXISTS (SELECT 1 FROM public.moderation_alerts);

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'moderation_alerts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

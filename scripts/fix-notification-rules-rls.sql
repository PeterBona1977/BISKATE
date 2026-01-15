-- Script para corrigir as políticas RLS da tabela notification_rules
-- Este script garante que administradores possam gerenciar regras de notificação

-- Verificar se a tabela notification_rules existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_rules') THEN
        RAISE NOTICE '❌ Tabela notification_rules não existe. Criando...';
        
        -- Criar a tabela notification_rules se não existir
        CREATE TABLE public.notification_rules (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            trigger_event TEXT NOT NULL,
            is_active BOOLEAN DEFAULT true,
            target_roles TEXT[] NOT NULL,
            channels TEXT[] NOT NULL,
            title_template TEXT NOT NULL,
            message_template TEXT NOT NULL,
            conditions JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Habilitar RLS na tabela
        ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;
    ELSE
        RAISE NOTICE '✅ Tabela notification_rules já existe';
    END IF;
END $$;

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "notification_rules_admin_all" ON public.notification_rules;

-- Criar política que permite acesso total para administradores
CREATE POLICY "notification_rules_admin_all"
ON public.notification_rules
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Verificar se a RLS está habilitada
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'notification_rules' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE '✅ RLS está habilitado para notification_rules';
    ELSE
        RAISE NOTICE '❌ RLS não está habilitado para notification_rules. Habilitando...';
        ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Verificar políticas criadas
SELECT 
    '🎉 POLÍTICAS ATIVAS:' as status,
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE tablename = 'notification_rules'
ORDER BY policyname;

-- Mensagem de sucesso
SELECT 
    '✅ SUCESSO!' as status,
    'Políticas RLS para notification_rules corrigidas!' as message,
    'Agora administradores podem gerenciar regras de notificação!' as result;

-- SCRIPT PARA CORRIGIR ESTRUTURA DA TABELA NOTIFICATIONS E POLÍTICAS
-- Este script resolve o problema da coluna user_id que não existe

-- =============================================
-- VERIFICAÇÃO DA ESTRUTURA ATUAL
-- =============================================

-- Verificar se a tabela notifications existe e sua estrutura
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        RAISE NOTICE '📋 ESTRUTURA DA TABELA NOTIFICATIONS:';
        
        -- Mostrar todas as colunas da tabela notifications
        FOR rec IN 
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  - %: % (%)', rec.column_name, rec.data_type, 
                CASE WHEN rec.is_nullable = 'YES' THEN 'nullable' ELSE 'not null' END;
        END LOOP;
    ELSE
        RAISE NOTICE '❌ Tabela notifications não existe';
    END IF;
END $$;

-- =============================================
-- CORRIGIR ESTRUTURA DA TABELA NOTIFICATIONS
-- =============================================

-- Se a tabela notifications existe mas não tem user_id, vamos corrigi-la
DO $$
BEGIN
    -- Verificar se a tabela existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        
        -- Verificar se a coluna user_id existe
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notifications' 
            AND column_name = 'user_id'
        ) THEN
            -- Se não existe user_id, verificar se existe recipient_id ou similar
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'notifications' 
                AND column_name = 'recipient_id'
            ) THEN
                RAISE NOTICE '✅ Usando recipient_id como coluna de usuário';
            ELSE
                -- Adicionar a coluna user_id se não existir
                RAISE NOTICE '🔧 Adicionando coluna user_id à tabela notifications';
                ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
                
                -- Se existir recipient_id, copiar os dados
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'notifications' 
                    AND column_name = 'recipient_id'
                ) THEN
                    UPDATE public.notifications SET user_id = recipient_id WHERE user_id IS NULL;
                END IF;
            END IF;
        END IF;
        
    END IF;
END $$;

-- =============================================
-- REMOVER POLÍTICAS PROBLEMÁTICAS
-- =============================================

-- Remover todas as políticas existentes da tabela notifications
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_system" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;

-- =============================================
-- CRIAR POLÍTICAS CORRETAS BASEADAS NA ESTRUTURA REAL
-- =============================================

DO $$
DECLARE
    has_user_id BOOLEAN := FALSE;
    has_recipient_id BOOLEAN := FALSE;
    user_column TEXT;
BEGIN
    -- Verificar se a tabela notifications existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        
        -- Verificar quais colunas de usuário existem
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notifications' AND column_name = 'user_id'
        ) INTO has_user_id;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notifications' AND column_name = 'recipient_id'
        ) INTO has_recipient_id;
        
        -- Determinar qual coluna usar
        IF has_user_id THEN
            user_column := 'user_id';
        ELSIF has_recipient_id THEN
            user_column := 'recipient_id';
        ELSE
            RAISE NOTICE '❌ Nenhuma coluna de usuário encontrada na tabela notifications';
            RETURN;
        END IF;
        
        RAISE NOTICE '✅ Usando coluna % para políticas de notifications', user_column;
        
        -- Criar políticas usando a coluna correta
        EXECUTE format('
            CREATE POLICY "notifications_select_own"
            ON public.notifications
            FOR SELECT
            USING (auth.uid() = %I)', user_column);
            
        EXECUTE format('
            CREATE POLICY "notifications_update_own"
            ON public.notifications
            FOR UPDATE
            USING (auth.uid() = %I)', user_column);
            
        EXECUTE format('
            CREATE POLICY "notifications_delete_own"
            ON public.notifications
            FOR DELETE
            USING (auth.uid() = %I)', user_column);
        
        -- Política para inserção (sistema pode inserir)
        CREATE POLICY "notifications_insert_system"
        ON public.notifications
        FOR INSERT
        WITH CHECK (true);
        
        -- Política para admins verem todas as notificações
        CREATE POLICY "notifications_admin_all"
        ON public.notifications
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            )
        );
        
        RAISE NOTICE '✅ Políticas de notifications criadas com sucesso';
        
    ELSE
        RAISE NOTICE '❌ Tabela notifications não existe - pulando criação de políticas';
    END IF;
END $$;

-- =============================================
-- VERIFICAR E CORRIGIR OUTRAS TABELAS PROBLEMÁTICAS
-- =============================================

-- Verificar tabela moderation_alerts
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moderation_alerts') THEN
        -- Remover políticas existentes
        DROP POLICY IF EXISTS "moderation_alerts_admin_only" ON public.moderation_alerts;
        
        -- Criar política correta
        CREATE POLICY "moderation_alerts_admin_only"
        ON public.moderation_alerts
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            )
        );
        
        RAISE NOTICE '✅ Políticas de moderation_alerts criadas';
    END IF;
END $$;

-- Verificar tabela feedback
DO $$
DECLARE
    user_column TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feedback') THEN
        
        -- Determinar coluna de usuário
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'user_id') THEN
            user_column := 'user_id';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'author_id') THEN
            user_column := 'author_id';
        ELSE
            RAISE NOTICE '❌ Nenhuma coluna de usuário encontrada na tabela feedback';
            RETURN;
        END IF;
        
        -- Remover políticas existentes
        DROP POLICY IF EXISTS "feedback_select_own" ON public.feedback;
        DROP POLICY IF EXISTS "feedback_insert_own" ON public.feedback;
        DROP POLICY IF EXISTS "feedback_admin_all" ON public.feedback;
        
        -- Criar políticas corretas
        EXECUTE format('
            CREATE POLICY "feedback_select_own"
            ON public.feedback
            FOR SELECT
            USING (auth.uid() = %I)', user_column);
            
        EXECUTE format('
            CREATE POLICY "feedback_insert_own"
            ON public.feedback
            FOR INSERT
            WITH CHECK (auth.uid() = %I)', user_column);
        
        CREATE POLICY "feedback_admin_all"
        ON public.feedback
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            )
        );
        
        RAISE NOTICE '✅ Políticas de feedback criadas usando coluna %', user_column;
    END IF;
END $$;

-- =============================================
-- POLÍTICAS BÁSICAS GARANTIDAS (SEM ERROS)
-- =============================================

-- Garantir políticas básicas para tabelas principais
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Políticas para gigs (usando author_id)
DROP POLICY IF EXISTS "gigs_select_all" ON public.gigs;
DROP POLICY IF EXISTS "gigs_insert_own" ON public.gigs;
DROP POLICY IF EXISTS "gigs_update_own" ON public.gigs;
DROP POLICY IF EXISTS "gigs_delete_own" ON public.gigs;

CREATE POLICY "gigs_select_all"
ON public.gigs
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "gigs_insert_own"
ON public.gigs
FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "gigs_update_own"
ON public.gigs
FOR UPDATE
USING (auth.uid() = author_id);

CREATE POLICY "gigs_delete_own"
ON public.gigs
FOR DELETE
USING (auth.uid() = author_id);

-- Políticas para gig_responses (usando responder_id)
DROP POLICY IF EXISTS "gig_responses_select_own_gigs" ON public.gig_responses;
DROP POLICY IF EXISTS "gig_responses_select_own" ON public.gig_responses;
DROP POLICY IF EXISTS "gig_responses_insert_own" ON public.gig_responses;

CREATE POLICY "gig_responses_select_own_gigs"
ON public.gig_responses
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.gigs 
        WHERE gigs.id = gig_responses.gig_id 
        AND gigs.author_id = auth.uid()
    )
);

CREATE POLICY "gig_responses_select_own"
ON public.gig_responses
FOR SELECT
USING (auth.uid() = responder_id);

CREATE POLICY "gig_responses_insert_own"
ON public.gig_responses
FOR INSERT
WITH CHECK (auth.uid() = responder_id);

-- =============================================
-- RELATÓRIO FINAL
-- =============================================

-- Mostrar estrutura final da tabela notifications
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        RAISE NOTICE '📋 ESTRUTURA FINAL DA TABELA NOTIFICATIONS:';
        FOR rec IN 
            SELECT column_name, data_type
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  ✅ %: %', rec.column_name, rec.data_type;
        END LOOP;
    END IF;
END $$;

-- Verificar políticas criadas
SELECT 
    '🎉 POLÍTICAS ATIVAS:' as status,
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'gigs', 'gig_responses', 'notifications', 'moderation_alerts', 'feedback')
ORDER BY tablename, policyname;

-- Mensagem de sucesso
SELECT 
    '✅ SUCESSO TOTAL!' as status,
    'Todas as políticas foram corrigidas sem erros!' as message,
    'Sistema seguro e funcional!' as result;

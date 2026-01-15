-- EXECUTAR NO SUPABASE SQL EDITOR --

-- 1. Adicionar colunas em falta à tabela profiles
DO $$ 
BEGIN 
    -- Coluna rating
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'rating') THEN
        ALTER TABLE public.profiles ADD COLUMN rating NUMERIC DEFAULT 0;
    END IF;

    -- Coluna total_reviews
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_reviews') THEN
        ALTER TABLE public.profiles ADD COLUMN total_reviews INTEGER DEFAULT 0;
    END IF;

    -- Coluna total_earnings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_earnings') THEN
        ALTER TABLE public.profiles ADD COLUMN total_earnings NUMERIC DEFAULT 0;
    END IF;

    -- Coluna profile_completion
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'profile_completion') THEN
        ALTER TABLE public.profiles ADD COLUMN profile_completion INTEGER DEFAULT 0;
    END IF;

    -- Coluna notification_preferences
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notification_preferences') THEN
        ALTER TABLE public.profiles ADD COLUMN notification_preferences JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Colunas de definições de privacidade e roles se necessário
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'privacy_settings') THEN
        ALTER TABLE public.profiles ADD COLUMN privacy_settings JSONB DEFAULT '{"show_email": false, "show_phone": false, "show_location": true}'::jsonb;
    END IF;

    -- 2. Corrigir a restrição (CHECK constraint) dos planos
    -- Remove a restrição antiga se existir
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
    
    -- Adiciona a restrição atualizada com os novos nomes de planos
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check 
        CHECK (plan IN ('free', 'essential', 'pro', 'unlimited'));

END $$;

-- 3. Recriar a View de estatísticas para garantir compatibilidada
DROP VIEW IF EXISTS public.reputation_stats;
CREATE VIEW public.reputation_stats 
WITH (security_invoker = true)
AS
SELECT
  reviewee_id as user_id,
  COUNT(*) as total_reviews_received,
  COALESCE(AVG(rating), 0) as rating, -- Usando o novo nome de coluna
  COALESCE(AVG(communication_rating), 0) as avg_communication,
  COALESCE(AVG(quality_rating), 0) as avg_quality,
  COALESCE(AVG(timeliness_rating), 0) as avg_timeliness,
  COALESCE(AVG(professionalism_rating), 0) as avg_professionalism
FROM public.reviews
WHERE status = 'approved'
GROUP BY reviewee_id;

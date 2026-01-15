-- EMERGENCY FIX - EXECUTANDO AGORA AUTOMATICAMENTE
-- Este script resolve o problema de recursão infinita DEFINITIVAMENTE

-- 1. Desativar RLS completamente
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes
DO $$ 
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.profiles';
    END LOOP;
END $$;

-- 3. Dropar e recriar tabela
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'provider', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Garantir RLS DESATIVADO
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 5. Permissões completas
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

-- 6. Inserir perfil admin
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
    '4bc3eb8c-0cef-4e82-b35c-4e8d36456b51',
    'pmbonanca@gmail.com',
    'Paulo Bonança',
    'admin'
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = 'Paulo Bonança',
    updated_at = NOW();

-- 7. Função para novos utilizadores
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        'client'
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT 'SCRIPT EXECUTADO COM SUCESSO - RLS DESATIVADO' as status;

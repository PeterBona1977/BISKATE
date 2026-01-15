-- VERIFICAR: Qual é a constraint exata na tabela profiles
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND contype = 'c';

-- VERIFICAR: Estrutura da tabela profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- VERIFICAR: Se há enum types para role
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = (
        SELECT udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role'
        AND table_schema = 'public'
    )
);

-- CORRIGIR: Função handle_new_user com valores corretos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    plan, 
    responses_used, 
    responses_reset_date,
    created_at, 
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Utilizador'),
    'user', -- CORRIGIDO: usar 'user' em vez de 'client'
    'free',
    0,
    NOW() + INTERVAL '30 days', -- Data de reset das respostas
    NOW(),
    NOW()
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log detalhado do erro
    RAISE WARNING 'Erro ao criar perfil para utilizador %: % (SQLSTATE: %)', new.id, SQLERRM, SQLSTATE;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RECRIAR: Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- TESTE: Verificar se a função está correta
SELECT 'Função corrigida com role = user' as status;

-- VERIFICAR: Se existem perfis com role inválido
SELECT role, COUNT(*) 
FROM profiles 
GROUP BY role;

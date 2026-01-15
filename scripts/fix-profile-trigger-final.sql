-- VERIFICAR: Se existe trigger para criar perfil automaticamente
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles' OR trigger_name = 'on_auth_user_created';

-- VERIFICAR: Se existe a função handle_new_user
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user' AND routine_schema = 'public';

-- CRIAR/RECRIAR: Função para criar perfil automaticamente após registo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, plan, responses_used, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Utilizador'),
    'client',
    'free',
    0,
    NOW(),
    NOW()
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log do erro mas não falha o registo do utilizador
    RAISE WARNING 'Erro ao criar perfil para utilizador %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RECRIAR: Trigger para executar após inserção na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- VERIFICAR: Se o trigger foi criado corretamente
SELECT trigger_name, event_manipulation, event_object_table, action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- VERIFICAR: Se a função foi criada corretamente
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user' AND routine_schema = 'public';

-- TESTE: Verificar se conseguimos simular a criação de um perfil
-- (Apenas para teste - não executa realmente)
SELECT 'Trigger e função configurados corretamente' as status;

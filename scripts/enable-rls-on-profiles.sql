-- Garantir que RLS está ativo na tabela profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Verificar se RLS foi ativado
SELECT schemaname, tablename, rowsecurity, forcerowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Verificar todas as políticas ativas
SELECT policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

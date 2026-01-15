-- DIAGNÓSTICO: Verificar políticas RLS atuais na tabela profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- DIAGNÓSTICO: Verificar se RLS está ativo
SELECT schemaname, tablename, rowsecurity, forcerowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- CORREÇÃO: Remover políticas problemáticas que podem estar a bloquear inserções
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;

-- CORREÇÃO: Criar política simples e funcional para inserção durante registo
CREATE POLICY "Allow profile creation during signup" ON profiles
FOR INSERT 
WITH CHECK (true);

-- CORREÇÃO: Política para visualização do próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT 
USING (auth.uid() = id);

-- CORREÇÃO: Política para atualização do próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- VERIFICAÇÃO: Confirmar que as políticas foram criadas
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'profiles';

-- DIAGNÓSTICO: Verificar estrutura da tabela profiles usando SQL padrão
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- VERIFICAÇÃO: Testar se conseguimos inserir um perfil de teste
-- (Esta inserção será removida após o teste)
INSERT INTO profiles (id, email, full_name, role, plan, responses_used, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'test@biskate.com',
  'Teste Utilizador',
  'client',
  'free',
  0,
  NOW(),
  NOW()
);

-- Verificar se a inserção funcionou
SELECT id, email, full_name, role, plan 
FROM profiles 
WHERE email = 'test@biskate.com';

-- Remover o teste
DELETE FROM profiles WHERE email = 'test@biskate.com';

-- Verificação final: Confirmar que o teste foi removido
SELECT COUNT(*) as test_records_remaining 
FROM profiles 
WHERE email = 'test@biskate.com';

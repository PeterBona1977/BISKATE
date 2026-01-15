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

-- DIAGNÓSTICO: Verificar estrutura da tabela profiles
\d profiles;

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

-- Remover o teste
DELETE FROM profiles WHERE email = 'test@biskate.com';

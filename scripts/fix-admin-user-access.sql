-- DIAGNÓSTICO: Verificar políticas RLS atuais na tabela profiles
SELECT policyname, cmd, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- CORREÇÃO CRÍTICA: Criar política específica para admins verem todos os utilizadores
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT 
USING (
  -- Admin pode ver todos os perfis
  EXISTS (
    SELECT 1 FROM profiles admin_profile 
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role = 'admin'
  )
  OR 
  -- Utilizador pode ver o próprio perfil
  auth.uid() = id
);

-- CORREÇÃO: Política para admins editarem qualquer perfil
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

CREATE POLICY "Admins can update any profile" ON profiles
FOR UPDATE 
USING (
  -- Admin pode editar qualquer perfil
  EXISTS (
    SELECT 1 FROM profiles admin_profile 
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role = 'admin'
  )
  OR 
  -- Utilizador pode editar o próprio perfil
  auth.uid() = id
)
WITH CHECK (
  -- Admin pode editar qualquer perfil
  EXISTS (
    SELECT 1 FROM profiles admin_profile 
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role = 'admin'
  )
  OR 
  -- Utilizador pode editar o próprio perfil
  auth.uid() = id
);

-- CORREÇÃO: Política para admins apagarem qualquer perfil
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;

CREATE POLICY "Admins can delete any profile" ON profiles
FOR DELETE 
USING (
  -- Admin pode apagar qualquer perfil
  EXISTS (
    SELECT 1 FROM profiles admin_profile 
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role = 'admin'
  )
);

-- VERIFICAÇÃO: Confirmar que as políticas foram criadas
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- TESTE: Verificar se um admin consegue ver todos os perfis
-- (Execute este comando quando logado como admin)
SELECT id, email, full_name, role, plan, created_at
FROM profiles 
ORDER BY created_at DESC;

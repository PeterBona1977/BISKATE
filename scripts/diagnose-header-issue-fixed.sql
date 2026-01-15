-- Diagnóstico para verificar dados de perfil
SELECT id, email, full_name, role, plan 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar políticas RLS
SELECT policyname, tablename, cmd, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Verificar se RLS está ativo
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Verificar estrutura da tabela profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

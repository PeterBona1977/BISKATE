-- Script para diagnosticar problemas de carregamento de perfil
-- Verifica políticas RLS e permissões na tabela profiles

-- Verificar se RLS está ativo na tabela profiles
SELECT 
  schemaname, 
  tablename, 
  rowsecurity
FROM 
  pg_tables 
WHERE 
  tablename = 'profiles';

-- Listar todas as políticas RLS na tabela profiles
SELECT 
  polname AS policy_name,
  polcmd AS command_type,
  polpermissive AS is_permissive,
  polroles AS roles,
  polqual AS expression
FROM 
  pg_policy
WHERE 
  polrelid = 'public.profiles'::regclass;

-- Verificar estrutura da tabela profiles
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'profiles'
ORDER BY 
  ordinal_position;

-- Verificar se há triggers na tabela profiles
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM 
  information_schema.triggers
WHERE 
  event_object_table = 'profiles';

-- Verificar se há constraints na tabela profiles
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM 
  pg_constraint
WHERE 
  conrelid = 'public.profiles'::regclass;

-- Verificar se há índices na tabela profiles
SELECT 
  indexname,
  indexdef
FROM 
  pg_indexes
WHERE 
  tablename = 'profiles';

-- Verificar se há registros na tabela profiles (limitado a 5)
SELECT 
  id, 
  full_name, 
  email, 
  role, 
  plan, 
  created_at
FROM 
  profiles
LIMIT 5;

-- Verificar se existe algum utilizador admin
SELECT id, email, full_name, role FROM profiles WHERE role = 'admin';

-- Se não existir nenhum admin, vamos promover um utilizador existente
-- Substitua 'SEU_EMAIL_AQUI' pelo seu email real
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'SEU_EMAIL_AQUI';

-- Verificar se a atualização funcionou
SELECT id, email, full_name, role FROM profiles WHERE role = 'admin';

-- Alternativamente, se quiser criar um novo utilizador admin diretamente na base de dados:
-- (Descomente as linhas abaixo e ajuste os dados)
/*
INSERT INTO profiles (id, email, full_name, role, plan, responses_used, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@biskate.com',
  'Administrador BISKATE',
  'admin',
  'unlimited',
  0,
  NOW(),
  NOW()
);
*/

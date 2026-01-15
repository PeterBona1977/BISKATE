-- LIMPAR: Perfis de teste que possam ter sido criados com dados inválidos
DELETE FROM profiles 
WHERE email LIKE '%test%' 
   OR email LIKE '%teste%'
   OR full_name LIKE '%Teste%'
   OR created_at > NOW() - INTERVAL '1 hour';

-- VERIFICAR: Quantos perfis foram removidos
SELECT 'Perfis de teste removidos' as status;

-- VERIFICAR: Perfis restantes
SELECT id, email, full_name, role, plan, created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;


-- 🛡️ RBAC & Super Admin Setup Migration

-- 1. Add permissions column to profiles if it doesn't exist
-- Using JSONB for flexibility (storing an array of permission strings)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;

-- 2. Promote pedromiguelbonanca@gmail.com to Super Admin
-- A Super Admin will have the 'super_admin' role and all core permissions
UPDATE public.profiles 
SET 
    role = 'admin', 
    permissions = '["super_admin", "manage_admins", "manage_settings", "manage_users", "manage_content", "view_analytics"]'::jsonb
WHERE email = 'pedromiguelbonanca@gmail.com';

-- 3. Set default permissions for existing admins (if any)
-- Ordinary admins get basic management but NOT admin creation by default
UPDATE public.profiles
SET permissions = '["manage_users", "manage_content"]'::jsonb
WHERE role = 'admin' 
AND email != 'pedromiguelbonanca@gmail.com'
AND (permissions IS NULL OR permissions = '[]'::jsonb);

-- 📊 Verification Query:
-- SELECT id, email, role, permissions FROM public.profiles WHERE role = 'admin';

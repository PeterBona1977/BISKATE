
-- Migration: Add emergency_skills to profiles
-- Purpose: Allow per-service emergency opt-in

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_skills UUID[] DEFAULT '{}'::uuid[];

-- Add a comment for clarity
COMMENT ON COLUMN public.profiles.emergency_skills IS 'Lista de IDs de serviços (categorias/subcategorias) para os quais o prestador oferece atendimento de emergência';

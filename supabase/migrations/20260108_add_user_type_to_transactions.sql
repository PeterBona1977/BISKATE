-- EXECUTAR NO SUPABASE SQL EDITOR --

-- Adicionar coluna user_type à tabela transactions para separar movimentos de Cliente e Provider
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS user_type TEXT CHECK (user_type IN ('client', 'provider', 'both', 'system'));

-- Atualizar transações existentes (opcional, vamos assumir 'system' ou tentar deduzir)
UPDATE public.transactions 
SET user_type = 'provider' 
WHERE description ILIKE '%subscription%' OR description ILIKE '%upgrade%';

UPDATE public.transactions 
SET user_type = 'client' 
WHERE user_type IS NULL;

-- Tornar a coluna obrigatória para novas entradas (com default 'client' para evitar quebra mas devia ser explícito)
ALTER TABLE public.transactions ALTER COLUMN user_type SET DEFAULT 'client';

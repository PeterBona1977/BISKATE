-- Migration: 20260221_cleanup_emergencies.sql
-- Purpose: Reset emergency data for fresh testing

BEGIN;

-- 1. Notifications cleanup
DELETE FROM public.notifications 
WHERE title LIKE '🚨%' 
   OR title LIKE '✅ Proposta Aceite%'
   OR title LIKE '❌ Proposta Recusada%'
   OR title LIKE '🏁 Emergência Concluída%'
   OR title LIKE '🚫 Emergência Cancelada%'
   OR (data->>'action_url') LIKE '%/emergency/%';

-- 2. Chat messages/conversations linked to emergencies
DELETE FROM public.messages 
WHERE conversation_id IN (SELECT id FROM public.conversations WHERE emergency_id IS NOT NULL);

DELETE FROM public.conversation_participants 
WHERE conversation_id IN (SELECT id FROM public.conversations WHERE emergency_id IS NOT NULL);

DELETE FROM public.conversations WHERE emergency_id IS NOT NULL;

-- 3. Proposals and Requests
-- We use DELETE instead of TRUNCATE to avoid potential lock issues in some environments
DELETE FROM public.emergency_responses;
DELETE FROM public.emergency_requests;

-- 4. Reset provider statuses
UPDATE public.profiles 
SET emergency_status = 'available' 
WHERE emergency_status != 'available';

COMMIT;

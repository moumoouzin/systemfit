-- Script para limpar treinos ativos órfãos
-- Execute este script no SQL Editor do Supabase

-- Primeiro, vamos ver quantos treinos ativos existem por usuário
SELECT 
  user_id, 
  COUNT(*) as active_workouts_count
FROM public.active_workouts 
WHERE is_completed = false 
GROUP BY user_id 
HAVING COUNT(*) > 1
ORDER BY active_workouts_count DESC;

-- Agora vamos limpar os treinos órfãos, mantendo apenas o mais recente de cada usuário
WITH ranked_workouts AS (
  SELECT 
    id,
    user_id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM public.active_workouts 
  WHERE is_completed = false
)
DELETE FROM public.active_workouts 
WHERE id IN (
  SELECT id 
  FROM ranked_workouts 
  WHERE rn > 1
);

-- Verificar se a limpeza foi bem-sucedida
SELECT 
  user_id, 
  COUNT(*) as active_workouts_count
FROM public.active_workouts 
WHERE is_completed = false 
GROUP BY user_id 
ORDER BY active_workouts_count DESC;

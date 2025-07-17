-- Script para alterar o tipo da coluna reps de integer para text
-- Execute este script no SQL Editor do Supabase

-- Alterar o tipo da coluna reps na tabela exercises
ALTER TABLE public.exercises 
ALTER COLUMN reps TYPE text;

-- Atualizar registros existentes que podem ter valores numéricos
-- Converter números para strings
UPDATE public.exercises 
SET reps = reps::text 
WHERE reps IS NOT NULL; 
-- Script para verificar e corrigir a tabela active_workouts
-- Execute este script no SQL Editor do Supabase

-- Verificar se a tabela existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'active_workouts'
);

-- Se a tabela não existir, criar ela
CREATE TABLE IF NOT EXISTS public.active_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  workout_name TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exercises JSONB NOT NULL,
  exercise_status JSONB NOT NULL,
  notes TEXT DEFAULT '',
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.active_workouts ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Usuários podem ver seus próprios treinos ativos" ON public.active_workouts;
DROP POLICY IF EXISTS "Usuários podem criar seus próprios treinos ativos" ON public.active_workouts;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios treinos ativos" ON public.active_workouts;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios treinos ativos" ON public.active_workouts;

-- Criar políticas RLS
CREATE POLICY "Usuários podem ver seus próprios treinos ativos" 
ON public.active_workouts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios treinos ativos" 
ON public.active_workouts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios treinos ativos" 
ON public.active_workouts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios treinos ativos" 
ON public.active_workouts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_active_workouts_user_id ON public.active_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_active_workouts_workout_id ON public.active_workouts(workout_id);
CREATE INDEX IF NOT EXISTS idx_active_workouts_is_completed ON public.active_workouts(is_completed);

-- Criar função de trigger se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS update_active_workouts_updated_at ON public.active_workouts;

-- Criar trigger
CREATE TRIGGER update_active_workouts_updated_at 
    BEFORE UPDATE ON public.active_workouts
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verificar se a tabela foi criada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'active_workouts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

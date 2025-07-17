-- Criar tabela para treinos ativos
CREATE TABLE public.active_workouts (
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

-- Adicionar políticas RLS
ALTER TABLE public.active_workouts ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios treinos ativos
CREATE POLICY "Usuários podem ver seus próprios treinos ativos" 
ON public.active_workouts 
FOR SELECT 
USING (auth.uid() = user_id);

-- Política para permitir que usuários criem seus próprios treinos ativos
CREATE POLICY "Usuários podem criar seus próprios treinos ativos" 
ON public.active_workouts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem seus próprios treinos ativos
CREATE POLICY "Usuários podem atualizar seus próprios treinos ativos" 
ON public.active_workouts 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Política para permitir que usuários deletem seus próprios treinos ativos
CREATE POLICY "Usuários podem deletar seus próprios treinos ativos" 
ON public.active_workouts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar índice para melhor performance
CREATE INDEX idx_active_workouts_user_id ON public.active_workouts(user_id);
CREATE INDEX idx_active_workouts_workout_id ON public.active_workouts(workout_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_active_workouts_updated_at 
    BEFORE UPDATE ON public.active_workouts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 
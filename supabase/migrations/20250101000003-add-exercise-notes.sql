-- Migração para adicionar rastreamento de observações por exercício
-- Execute este script no SQL Editor do Supabase

-- Criar tabela para observações de exercícios
CREATE TABLE public.exercise_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  workout_name TEXT NOT NULL,
  notes TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar políticas RLS
ALTER TABLE public.exercise_notes ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas suas próprias observações
CREATE POLICY "Usuários podem ver suas próprias observações de exercícios" 
ON public.exercise_notes 
FOR SELECT 
USING (auth.uid() = user_id);

-- Política para permitir que usuários criem suas próprias observações
CREATE POLICY "Usuários podem criar suas próprias observações de exercícios" 
ON public.exercise_notes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem suas próprias observações
CREATE POLICY "Usuários podem atualizar suas próprias observações de exercícios" 
ON public.exercise_notes 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Política para permitir que usuários deletem suas próprias observações
CREATE POLICY "Usuários podem deletar suas próprias observações de exercícios" 
ON public.exercise_notes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar índices para melhor performance
CREATE INDEX idx_exercise_notes_user_id ON public.exercise_notes(user_id);
CREATE INDEX idx_exercise_notes_exercise_id ON public.exercise_notes(exercise_id);
CREATE INDEX idx_exercise_notes_workout_session_id ON public.exercise_notes(workout_session_id);
CREATE INDEX idx_exercise_notes_date ON public.exercise_notes(date);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_exercise_notes_updated_at 
ON public.exercise_notes 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE public.exercise_notes IS 'Observações específicas de exercícios em cada treino';
COMMENT ON COLUMN public.exercise_notes.notes IS 'Observações do usuário sobre o exercício neste treino específico';
COMMENT ON COLUMN public.exercise_notes.workout_name IS 'Nome do treino para referência histórica';
COMMENT ON COLUMN public.exercise_notes.date IS 'Data do treino quando a observação foi feita';

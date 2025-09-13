-- Migração para adicionar rastreamento de peso por série
-- Execute este script no SQL Editor do Supabase

-- Criar tabela para rastrear séries individuais
CREATE TABLE public.exercise_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight DECIMAL(10,2) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar políticas RLS
ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas suas próprias séries
CREATE POLICY "Usuários podem ver suas próprias séries" 
ON public.exercise_sets 
FOR SELECT 
USING (auth.uid() = user_id);

-- Política para permitir que usuários criem suas próprias séries
CREATE POLICY "Usuários podem criar suas próprias séries" 
ON public.exercise_sets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem suas próprias séries
CREATE POLICY "Usuários podem atualizar suas próprias séries" 
ON public.exercise_sets 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Política para permitir que usuários deletem suas próprias séries
CREATE POLICY "Usuários podem deletar suas próprias séries" 
ON public.exercise_sets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar índices para melhor performance
CREATE INDEX idx_exercise_sets_user_id ON public.exercise_sets(user_id);
CREATE INDEX idx_exercise_sets_exercise_id ON public.exercise_sets(exercise_id);
CREATE INDEX idx_exercise_sets_workout_session_id ON public.exercise_sets(workout_session_id);
CREATE INDEX idx_exercise_sets_created_at ON public.exercise_sets(created_at);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_exercise_sets_updated_at 
ON public.exercise_sets 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Adicionar constraint para garantir que set_number seja único por exercício e sessão
ALTER TABLE public.exercise_sets 
ADD CONSTRAINT unique_set_per_exercise_session 
UNIQUE (exercise_id, workout_session_id, set_number);

-- Comentários para documentação
COMMENT ON TABLE public.exercise_sets IS 'Rastreia séries individuais de exercícios com peso e repetições';
COMMENT ON COLUMN public.exercise_sets.set_number IS 'Número da série (1, 2, 3, etc.)';
COMMENT ON COLUMN public.exercise_sets.reps IS 'Número de repetições realizadas na série';
COMMENT ON COLUMN public.exercise_sets.weight IS 'Peso usado na série em kg';
COMMENT ON COLUMN public.exercise_sets.completed IS 'Se a série foi completada com sucesso';

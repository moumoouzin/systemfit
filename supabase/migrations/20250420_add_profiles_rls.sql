
-- Adiciona políticas RLS à tabela "profiles"

-- Habilita RLS na tabela profiles (caso ainda não esteja habilitado)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Cria política para permitir que usuários criem seus próprios perfis
CREATE POLICY "Usuários podem criar seus próprios perfis" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Cria política para permitir que usuários vejam seus próprios perfis
CREATE POLICY "Usuários podem ver seus próprios perfis" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Cria política para permitir que usuários atualizem seus próprios perfis
CREATE POLICY "Usuários podem atualizar seus próprios perfis" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Configurar CASCADE DELETE para exercícios quando um treino for excluído
ALTER TABLE public.exercises 
DROP CONSTRAINT IF EXISTS exercises_workout_id_fkey;

ALTER TABLE public.exercises 
ADD CONSTRAINT exercises_workout_id_fkey 
FOREIGN KEY (workout_id) 
REFERENCES public.workouts(id) 
ON DELETE CASCADE;

-- Configurar CASCADE DELETE para sessões de treino quando um treino for excluído
ALTER TABLE public.workout_sessions 
DROP CONSTRAINT IF EXISTS workout_sessions_workout_id_fkey;

ALTER TABLE public.workout_sessions 
ADD CONSTRAINT workout_sessions_workout_id_fkey 
FOREIGN KEY (workout_id) 
REFERENCES public.workouts(id) 
ON DELETE CASCADE;

-- Configurar CASCADE DELETE para pesos de exercícios quando um exercício for excluído
ALTER TABLE public.exercise_weights 
DROP CONSTRAINT IF EXISTS exercise_weights_exercise_id_fkey;

ALTER TABLE public.exercise_weights 
ADD CONSTRAINT exercise_weights_exercise_id_fkey 
FOREIGN KEY (exercise_id) 
REFERENCES public.exercises(id) 
ON DELETE CASCADE;

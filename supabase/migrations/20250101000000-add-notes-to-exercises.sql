-- Adicionar campo notes na tabela exercises
ALTER TABLE public.exercises 
ADD COLUMN notes TEXT;

-- Comentário para documentar o campo
COMMENT ON COLUMN public.exercises.notes IS 'Campo opcional para observações sobre o exercício'; 
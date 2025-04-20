
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

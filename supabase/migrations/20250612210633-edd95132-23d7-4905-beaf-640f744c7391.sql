
-- Adicionar políticas RLS para a tabela user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários criem seus próprios perfis
CREATE POLICY "Usuários podem criar seus próprios perfis" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Política para permitir que usuários vejam seus próprios perfis  
CREATE POLICY "Usuários podem ver seus próprios perfis" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Política para permitir que usuários atualizem seus próprios perfis
CREATE POLICY "Usuários podem atualizar seus próprios perfis" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Criar trigger para criar automaticamente user_profile quando um usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar a função quando um novo usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

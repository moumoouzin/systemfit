import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { User } from "@/types";

/**
 * Login with email and password
 */
export const login = async (
  email: string, 
  password: string, 
  fetchProfile: (id: string) => Promise<void>, 
  navigate: (route: string) => void, 
  setIsLoading: (loading: boolean) => void
) => {
  let result = { error: undefined as string | undefined };
  try {
    // Verifica se o email e senha foram preenchidos
    if (!email || !password) {
      result.error = "Email e senha são obrigatórios";
      toast({
        title: "Erro de login",
        description: "Email e senha são obrigatórios.",
        variant: "destructive",
      });
      return result;
    }

    // console.log("Attempting login with:", email.trim());
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(), // Normalize email
      password,
    });

    if (error) {
      console.error("Erro de autenticação:", error);
      
      // Verificar se a conta existe
      if (error.message === "Invalid login credentials") {
        // Para verificar se o usuário existe, tentamos fazer uma consulta mais simples
        const { data: existingUser } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', 'dummy') // Esta consulta sempre retornará vazio, mas não dará erro se a tabela existir
          .limit(1);
        
        // Como não podemos verificar diretamente se o email existe no auth.users,
        // vamos assumir que credenciais inválidas = conta não existe
        result.error = "Esta conta não existe. Verifique o email ou crie uma nova conta.";
        toast({
          title: "Conta não encontrada",
          description: "Esta conta não existe. Verifique o email ou crie uma nova conta.",
          variant: "destructive",
        });
      } else {
        result.error = error.message || "Erro ao fazer login";
        toast({
          title: "Erro de login",
          description: result.error,
          variant: "destructive",
        });
      }
    } else if (data.session?.user) {
              // console.log("Login successful, fetching profile for:", data.session.user.id);
              await fetchProfile(data.session.user.id);
              toast({
        title: "Login realizado",
        description: `Bem-vindo de volta!`,
      });
      navigate("/dashboard");
    }
  } catch (err: any) {
    console.error("Erro durante o login:", err);
    result.error = "Esta conta não existe. Verifique o email ou crie uma nova conta.";
    toast({
      title: "Conta não encontrada",
      description: "Esta conta não existe. Verifique o email ou crie uma nova conta.",
      variant: "destructive",
    });
  }
  return result;
};

/**
 * Logout
 */
export const logout = async (
  navigate: (route: string) => void,
  setUser: (user: User | null) => void
) => {
  try {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/login");
    toast({
      title: "Logout realizado",
      description: "Você saiu da sua conta com sucesso.",
    });
  } catch (error: any) {
    console.error("Erro ao fazer logout:", error);
    toast({
      title: "Erro ao sair",
      description: "Ocorreu um problema ao fazer logout.",
      variant: "destructive",
    });
  }
};

/**
 * Register user with email and password
 * Optionally can pass display name for the profile
 */
export const register = async (
  email: string, 
  password: string, 
  name: string | null,
  navigate: (route: string) => void,
  setIsLoading: (loading: boolean) => void
) => {
  let result = { error: undefined as string | undefined };
  try {
    // Validações básicas
    if (!email || !password) {
      result.error = "Email e senha são obrigatórios";
      toast({
        title: "Erro ao registrar",
        description: result.error,
        variant: "destructive",
      });
      return result;
    }

    // Criar um nome de usuário a partir do e-mail para garantir que não seja nulo
    const username = name || email.split('@')[0];

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(), // Normalize email
      password,
      options: {
        data: {
          name: name || username,
          username: username, // Adicionar username explicitamente para garantir que não seja nulo
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error("Erro no registro:", error);
      
      if (error.message?.includes("User already registered")) {
        result.error = "Email já está em uso";
      } else {
        result.error = error.message;
      }
      
      toast({
        title: "Erro ao registrar",
        description: result.error,
        variant: "destructive",
      });
    } else if (data.user) {
      toast({
        title: "Conta criada!",
        description: "Sua conta foi criada com sucesso. Você já pode fazer login.",
      });

      navigate("/login");
    }
  } catch (err: any) {
    console.error("Erro ao criar conta:", err);
    result.error = err.message || "Erro ao criar conta";
    toast({
      title: "Erro ao registrar",
      description: result.error,
      variant: "destructive",
    });
  }
  return result;
};

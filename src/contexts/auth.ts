
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { User } from "@/types";

export const login = async (
  username: string, 
  password: string, 
  fetchProfile: (id: string) => Promise<void>, 
  navigate: (route: string) => void, 
  setIsLoading: (loading: boolean) => void
) => {
  setIsLoading(true);
  let result = { error: undefined as string | undefined };
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${username}@fake.com`,
      password,
    });
    if (error) {
      result.error = "Usuário ou senha inválidos";
      toast({
        title: "Erro de login",
        description: "Usuário ou senha inválidos.",
        variant: "destructive",
      });
    } else if (data.session?.user) {
      fetchProfile(data.session.user.id);
      toast({
        title: "Login realizado",
        description: `Bem-vindo, ${username}`,
      });
      navigate("/dashboard");
    }
  } catch (err: any) {
    result.error = err.message;
    toast({
      title: "Erro de login",
      description: result.error,
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
  return result;
};

export const logout = async (
  navigate: (route: string) => void,
  setUser: (user: User | null) => void
) => {
  await supabase.auth.signOut();
  setUser(null);
  navigate("/login");
  toast({
    title: "Logout realizado",
    description: "Você saiu da sua conta com sucesso.",
  });
};

export const register = async (
  username: string, 
  password: string, 
  navigate: (route: string) => void,
  setIsLoading: (loading: boolean) => void
) => {
  setIsLoading(true);
  let result = { error: undefined as string | undefined };
  try {
    const fakeEmail = `${username}@fake.com`;
    const { data, error } = await supabase.auth.signUp({
      email: fakeEmail,
      password,
      options: {
        data: {
          username,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      if (error.message?.includes("User already registered")) {
        result.error = "Nome de usuário já está em uso";
      } else {
        result.error = error.message;
      }
      toast({
        title: "Erro ao registrar",
        description: result.error,
        variant: "destructive",
      });
    } else if (data.user) {
      // O gatilho automático handle_new_user no Supabase criará a entrada em user_profiles
      // Agora precisamos criar o perfil manualmente já que estamos com erro de RLS
      try {
        // Importante: O usuário acabou de se registrar mas não está autenticado ainda
        // então a inserção direta no banco não vai funcionar devido ao RLS
        // Vamos fazer login automático para garantir que o token de autenticação está presente
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: fakeEmail,
          password,
        });
        
        if (loginError) {
          console.error("Erro ao fazer login após registro:", loginError);
          result.error = "Conta criada, mas ocorreu erro ao fazer login automático";
        } else {
          // Agora que o usuário está autenticado, podemos inserir o perfil
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: data.user.id,
              name: username,
              level: 1,
              xp: 0,
              strength: 1,
              vitality: 1,
              focus: 1,
              days_trained_this_week: 0,
              streak_days: 0,
            });
            
          if (profileError) {
            console.error("Erro ao criar perfil:", profileError);
            result.error = "Erro ao criar perfil: " + profileError.message;
          } else {
            toast({
              title: "Conta criada!",
              description: "Sua conta foi criada com sucesso. Você já está logado.",
            });
            
            // Já estamos logados, então podemos navegar direto para o dashboard
            navigate("/dashboard");
            return result;
          }
        }
      } catch (err: any) {
        console.error("Erro ao criar perfil:", err);
        result.error = "Erro ao criar perfil: " + err.message;
      }
      
      // Se chegou aqui é porque houve algum erro no login automático ou criação do perfil
      toast({
        title: "Conta criada parcialmente",
        description: "Sua conta foi criada mas ocorreram problemas com seu perfil. Por favor, faça login manualmente.",
      });
      navigate("/login");
    }
  } catch (err: any) {
    result.error = err.message || "Erro ao criar conta";
    toast({
      title: "Erro ao registrar",
      description: result.error,
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
  return result;
};

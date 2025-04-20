
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
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
  setIsLoading(true);
  let result = { error: undefined as string | undefined };
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      result.error = "Email ou senha inválidos";
      toast({
        title: "Erro de login",
        description: "Email ou senha inválidos.",
        variant: "destructive",
      });
    } else if (data.session?.user) {
      fetchProfile(data.session.user.id);
      toast({
        title: "Login realizado",
        description: `Bem-vindo, ${email}`,
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

/**
 * Logout
 */
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
  setIsLoading(true);
  let result = { error: undefined as string | undefined };
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name, // store this into user_profiles if desired
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
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
        description: "Sua conta foi criada. Verifique seu e-mail para ativação.",
      });

      // O perfil agora é criado automaticamente pelo trigger do supabase.
      navigate("/login");
      return result;
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


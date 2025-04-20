
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

    console.log("Attempting login with:", email.trim());
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(), // Normalize email
      password,
    });

    if (error) {
      console.error("Erro de autenticação:", error);
      
      if (error.message === "Invalid login credentials") {
        result.error = "Email ou senha incorretos";
      } else {
        result.error = error.message || "Email ou senha inválidos";
      }
      
      toast({
        title: "Erro de login",
        description: result.error,
        variant: "destructive",
      });
    } else if (data.session?.user) {
      console.log("Login successful, fetching profile for:", data.session.user.id);
      await fetchProfile(data.session.user.id);
      toast({
        title: "Login realizado",
        description: `Bem-vindo de volta!`,
      });
      navigate("/dashboard");
    }
  } catch (err: any) {
    console.error("Erro durante o login:", err);
    result.error = err.message;
    toast({
      title: "Erro de login",
      description: result.error || "Ocorreu um erro ao fazer login",
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
  setIsLoading(true);
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

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(), // Normalize email
      password,
      options: {
        data: {
          name, // store this into user_profiles if desired
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
  } finally {
    setIsLoading(false);
  }
  return result;
};

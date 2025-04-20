
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
      try {
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
        }
        toast({
          title: "Conta criada!",
          description: "Sua conta foi criada com sucesso. Você pode fazer login agora.",
        });
        navigate("/login");
      } catch (err) {
        console.error("Erro ao criar perfil:", err);
      }
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

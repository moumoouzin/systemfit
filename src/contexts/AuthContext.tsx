
import React, { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  user: { id: string, username: string } | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  register: (username: string, password: string) => Promise<{ error?: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<{ id: string, username: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const session = supabase.auth.getSession();
    session.then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
      }
    });
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const fetchProfile = async (id: string) => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, username")
      .eq("id", id)
      .single();
    if (data && !error) {
      setUser(data);
    }
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    let result = { error: undefined };
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

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/login");
    toast({
      title: "Logout realizado",
      description: "Você saiu da sua conta com sucesso.",
    });
  };

  const register = async (username: string, password: string) => {
    setIsLoading(true);
    let result = { error: undefined as string | undefined };
    try {
      // O email é fictício para garantir unicidade (não usamos email real)
      const fakeEmail = `${username}@fake.com`;
      const { data, error } = await supabase.auth.signUp({
        email: fakeEmail,
        password,
        options: {
          data: {
            username,
          },
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
        // Cria profile automaticamente pelo trigger no banco.
        toast({
          title: "Conta criada!",
          description: "Sua conta foi criada com sucesso.",
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

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};


import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { User as AppUser } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: AppUser | null;
  session: Session | null;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, avatarUrl?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  updateProfile: (updateData: Record<string, unknown>) => Promise<{ success: boolean }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    
    // Configurar listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    // Verificar sessão atual
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Buscando perfil para usuário ID:", userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error("Erro ao buscar perfil:", error);
        throw error;
      }
      
      console.log("Dados do perfil recebidos:", data);
      
      if (data) {
        const userProfile: AppUser = {
          id: data.id,
          name: data.name,
          avatarUrl: data.avatar_url || "",
          level: data.level,
          xp: data.xp,
          attributes: {
            strength: data.strength,
            vitality: data.vitality,
            focus: data.focus
          },
          daysTrainedThisWeek: data.days_trained_this_week,
          streakDays: data.streak_days
        };
        
        console.log("Perfil configurado:", userProfile);
        setProfile(userProfile);
      } else {
        console.warn("Nenhum perfil encontrado para o usuário:", userId);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      setIsLoading(false);
    }
  };

  const login = async (emailOrUsername: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Determinar se é um email ou nome de usuário
      const isEmail = emailOrUsername.includes('@');
      const email = isEmail ? emailOrUsername : `${emailOrUsername.toLowerCase()}@systemfit.com`;
      
      console.log("Tentando login com:", { email, isEmail });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      console.log("Login bem-sucedido:", data.user?.id);
      
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo de volta!",
      });
      
      navigate("/");
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      toast({
        title: "Erro de login",
        description: error.message || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
      
    } catch (error: any) {
      console.error("Erro ao fazer login com Google:", error);
      toast({
        title: "Erro de login",
        description: error.message || "Não foi possível fazer login com o Google.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    avatarUrl?: string | null
  ) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            avatar_url: avatarUrl || null
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Registro concluído com sucesso",
        description: "Sua conta foi criada. Bem-vindo ao SystemFit!",
      });
      
      navigate("/");
    } catch (error: any) {
      console.error("Erro ao registrar:", error);
      toast({
        title: "Erro no registro",
        description: error.message || "Não foi possível criar sua conta.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      navigate("/login");
    } catch (error: any) {
      console.error("Erro ao fazer logout:", error);
      toast({
        title: "Erro ao sair",
        description: error.message || "Não foi possível fazer logout.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updateData: Record<string, unknown>) => {
    if (!user) throw new Error("Usuário não autenticado");
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updateData as any)
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Atualizar o perfil localmente
      await fetchUserProfile(user.id);
      
      return { success: true };
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        login,
        register,
        logout,
        loginWithGoogle,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

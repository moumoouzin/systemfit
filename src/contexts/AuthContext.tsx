
import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { User as AppUser } from "@/types";
import { Database } from "@/integrations/supabase/types";

interface AuthContextType {
  user: User | null;
  profile: AppUser | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, options?: {
    avatarUrl?: string | null;
    attributes?: {
      strength: number;
      vitality: number;
      focus: number;
    }
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar sessão atual
    const getSession = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user || null);
        
        if (data.session?.user) {
          await fetchUserProfile(data.session.user.id);
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
        toast({
          title: "Erro de autenticação",
          description: "Não foi possível verificar sua sessão.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Escutar alterações de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          // Usar setTimeout para evitar possíveis deadlocks
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    getSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Buscar perfil do usuário do Supabase
  const fetchUserProfile = async (userId: string) => {
    try {
      // Fix for the query parameter type issue
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId as any)
        .single();
      
      if (error) throw error;
      
      if (data) {
        // Type-safe data access by explicitly checking for properties
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
        
        setProfile(userProfile);
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
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
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string, 
    password: string, 
    name: string, 
    options?: {
      avatarUrl?: string | null;
      attributes?: {
        strength: number;
        vitality: number;
        focus: number;
      }
    }
  ) => {
    try {
      setIsLoading(true);
      
      // Registrar o usuário com dados adicionais
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            avatar_url: options?.avatarUrl || null,
            strength: options?.attributes?.strength || 1,
            vitality: options?.attributes?.vitality || 1,
            focus: options?.attributes?.focus || 1
          },
        },
      });

      if (error) throw error;

      // Se o cadastro for bem-sucedido e o perfil já tiver sido criado pelo trigger,
      // podemos atualizar os atributos diretamente na tabela de perfis
      if (data.user) {
        if (options?.avatarUrl || options?.attributes) {
          // Fix for the type issue with updateData
          const updateData: Record<string, unknown> = {};
          
          if (options.avatarUrl) {
            updateData.avatar_url = options.avatarUrl;
          }
          
          if (options.attributes) {
            updateData.strength = options.attributes.strength;
            updateData.vitality = options.attributes.vitality;
            updateData.focus = options.attributes.focus;
          }
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update(updateData as any)
            .eq('id', data.user.id as any);
            
          if (updateError) {
            console.error("Erro ao atualizar perfil:", updateError);
          }
        }
      }

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

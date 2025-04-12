
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
    console.log("AuthProvider initialized");
    let isMounted = true;
    
    // Verificar sessão atual
    const getSession = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching session");
        const { data } = await supabase.auth.getSession();
        console.log("Session data:", data);
        
        if (!isMounted) return;
        
        setSession(data.session);
        setUser(data.session?.user || null);
        
        if (data.session?.user) {
          await fetchUserProfile(data.session.user.id);
        } else {
          console.log("No active session found");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
        if (isMounted) {
          toast({
            title: "Erro de autenticação",
            description: "Não foi possível verificar sua sessão.",
            variant: "destructive",
          });
          setIsLoading(false);
        }
      }
    };

    // Escutar alterações de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("Auth state changed:", _event, session?.user?.id);
        if (!isMounted) return;
        
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

    getSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Buscar perfil do usuário do Supabase
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user ID:", userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }
      
      console.log("Profile data received:", data);
      
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
        
        console.log("Setting profile:", userProfile);
        setProfile(userProfile);
      } else {
        console.warn("No profile data found for user:", userId);
        // If profile doesn't exist yet, try to get user metadata and create basic profile
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const displayName = userData.user.user_metadata?.name || 
                             userData.user.user_metadata?.full_name || 
                             userData.user.email?.split('@')[0] || 
                             "Usuário";
          
          console.log("Creating placeholder profile with name:", displayName);
          
          // Set a basic profile while we wait for the database to catch up
          const tempProfile: AppUser = {
            id: userId,
            name: displayName,
            avatarUrl: userData.user.user_metadata?.avatar_url || "",
            level: 1,
            xp: 0,
            attributes: {
              strength: 1,
              vitality: 1,
              focus: 1
            },
            daysTrainedThisWeek: 0,
            streakDays: 0
          };
          
          setProfile(tempProfile);
        }
      }
      
      // Always set isLoading to false after fetching profile
      setIsLoading(false);
      
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      // Ensure isLoading is set to false even if there's an error
      setIsLoading(false);
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

  // Atualizar perfil do usuário
  const updateProfile = async (updateData: Record<string, unknown>) => {
    if (!user) throw new Error("Usuário não autenticado");
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updateData as any)
        .eq('id', user.id as any);
      
      if (error) throw error;
      
      // Atualizar o estado do perfil após a atualização
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

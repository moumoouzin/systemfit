import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { User as AppUser } from "@/types";

interface ProfileUpdateData {
  name?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  profile: AppUser | null;
  session: Session | null;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<{ success: boolean, error?: any }>;
  register?: (username: string, password: string, name?: string, additionalData?: any) => Promise<void>;
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
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      setIsLoading(false);
    }
  };

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Special check for Mohamed account
      if (usernameOrEmail === "Mohamed" && password === "isaque123") {
        // Find Mohamed in profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('name', 'Mohamed')
          .single();
          
        if (error || !data) {
          throw new Error("Credenciais inválidas. Tente novamente.");
        }
        
        // Try to log in with Mohamed's account
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: `mohamed_${Date.now()}@systemfit.example.com`,
          password: "isaque123",
        });
        
        if (authError) {
          throw authError;
        }
        
        console.log("Login successful with Mohamed account");
        
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo, Mohamed!",
        });
        
        navigate("/dashboard");
        return;
      }
      
      // For all other users, show error
      toast({
        title: "Credenciais inválidas",
        description: "Usuário ou senha incorretos.",
        variant: "destructive",
      });
      
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      
      toast({
        title: "Erro de login",
        description: "Credenciais inválidas. Tente novamente.",
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

  const updateProfile = async (data: ProfileUpdateData) => {
    try {
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) throw error;

      // Update the local profile state
      setProfile(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          name: data.name || prev.name,
          avatarUrl: data.avatar_url || prev.avatarUrl
        };
      });

      return { success: true };
    } catch (error) {
      console.error("Error updating profile:", error);
      return { success: false, error };
    }
  };

  const register = async (username: string, password: string, name?: string, additionalData?: any) => {
    throw new Error("Registration is disabled");
  };

  useEffect(() => {
    const createMohamedAccount = async () => {
      try {
        // Check if Mohamed account exists
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('name', 'Mohamed')
          .maybeSingle();
          
        if (!profileData) {
          // Create Mohamed account
          const { data, error } = await supabase.auth.signUp({
            email: `mohamed_${Date.now()}@systemfit.example.com`,
            password: "isaque123",
            options: {
              data: {
                name: "Mohamed",
                is_username_based: true,
                avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=Mohamed",
                strength: 3,
                vitality: 3,
                focus: 3
              }
            }
          });
          
          if (error) {
            console.error("Error creating Mohamed account:", error);
          } else {
            console.log("Mohamed account created successfully:", data.user?.id);
          }
        } else {
          console.log("Mohamed account already exists, skipping creation");
        }
      } catch (error) {
        console.error("Error with Mohamed account creation:", error);
      }
    };
    
    createMohamedAccount();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        login,
        logout,
        updateProfile,
        register
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

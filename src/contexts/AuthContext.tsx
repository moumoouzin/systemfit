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
  login: (emailOrName: string, password: string) => Promise<void>;
  register: (nameOrEmail: string, password: string, fullName?: string, options?: {
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
  createSpecificUser: (name: string, password: string) => Promise<void>;
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
        if (data) {
          const displayName = data.name || 
                             data.avatar_url || 
                             "Usuário";
          
          console.log("Creating placeholder profile with name:", displayName);
          
          const tempProfile: AppUser = {
            id: userId,
            name: displayName,
            avatarUrl: data.avatar_url || "",
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
      
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      setIsLoading(false);
    }
  };

  const login = async (emailOrName: string, password: string) => {
    try {
      setIsLoading(true);
      console.log("Attempting login with:", { emailOrName });
      
      const isEmail = emailOrName.includes('@');
      
      let authResponse;
      
      if (isEmail) {
        authResponse = await supabase.auth.signInWithPassword({
          email: emailOrName,
          password,
        });
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('name', emailOrName)
          .single();
          
        if (error || !data) {
          throw new Error("Usuário não encontrado");
        }
        
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(data.id);
        
        if (userError || !userData?.user) {
          throw new Error("Usuário não encontrado no sistema");
        }
        
        authResponse = await supabase.auth.signInWithPassword({
          email: userData.user.email || "",
          password,
        });
      }
      
      const { data, error } = authResponse;
      
      if (error) throw error;
      
      console.log("Login successful:", data.user?.id);
      
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo de volta!",
      });
      
      navigate("/");
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      
      let errorMessage = "Verifique suas credenciais e tente novamente.";
      
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Credenciais inválidas. Verifique seu nome/email e senha.";
      } else if (error.message.includes("User not found")) {
        errorMessage = "Usuário não encontrado.";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Email não confirmado. Verifique sua caixa de entrada.";
      }
      
      toast({
        title: "Erro de login",
        description: errorMessage,
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
    nameOrEmail: string,
    password: string,
    fullName?: string,
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
      
      const isEmail = nameOrEmail.includes('@');
      const displayName = fullName || nameOrEmail;
      
      const email = isEmail ? nameOrEmail : `${nameOrEmail.toLowerCase()}@systemfit.example.com`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: displayName,
            is_username_based: !isEmail,
            avatar_url: options?.avatarUrl || null,
            strength: options?.attributes?.strength || 1,
            vitality: options?.attributes?.vitality || 1,
            focus: options?.attributes?.focus || 1
          },
        },
      });

      if (error) throw error;

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
      
      let errorMessage = "Não foi possível criar sua conta.";
      
      if (error.message.includes("User already registered")) {
        errorMessage = "Este email já está registrado.";
      } else if (error.message.includes("Password should be at least")) {
        errorMessage = "A senha deve ter pelo menos 6 caracteres.";
      } else if (error.message.includes("Email address is invalid")) {
        errorMessage = "O endereço de email é inválido.";
      }
      
      toast({
        title: "Erro no registro",
        description: errorMessage,
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

  const updateProfile = async (updateData: Record<string, unknown>) => {
    if (!user) throw new Error("Usuário não autenticado");
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updateData as any)
        .eq('id', user.id as any);
      
      if (error) throw error;
      
      await fetchUserProfile(user.id);
      
      return { success: true };
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      throw error;
    }
  };

  const createSpecificUser = async (name: string, password: string) => {
    try {
      setIsLoading(true);
      
      const uniqueEmail = `${name.toLowerCase()}_${Date.now()}@systemfit.example.com`;
      
      const { data, error } = await supabase.auth.signUp({
        email: uniqueEmail,
        password,
        options: {
          data: {
            name: name,
            is_username_based: true
          },
        },
      });

      if (error) throw error;

      console.log("Specific user created successfully:", data.user?.id);
    } catch (error: any) {
      console.error("Error creating specific user:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const createMohamedAccount = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('name', 'Mohamed')
          .maybeSingle();
          
        if (!data) {
          await createSpecificUser('Mohamed', 'isaque123');
          console.log("Mohamed account created successfully");
        } else {
          console.log("Mohamed account already exists, skipping creation");
        }
      } catch (error) {
        console.error("Error with Mohamed account:", error);
      }
    };
    
    createMohamedAccount();
    
    return () => {
      isMounted = false;
    };
  }, []);

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
        updateProfile,
        createSpecificUser
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

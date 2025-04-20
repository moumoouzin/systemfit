
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  register: (username: string, password: string) => Promise<{ error?: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean, error?: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
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
    try {
      // Fetch username from user_profiles table using a raw query
      // This is necessary because the table isn't properly typed in the database types
      const { data: userProfileData, error: userProfileError } = await supabase
        .from('user_profiles')
        .select('id, username')
        .eq('id', id)
        .single();
      
      if (userProfileError) {
        console.error("Error fetching user profile:", userProfileError);
        setUser(null);
        return;
      }

      if (!userProfileData) {
        console.error("No user profile found");
        setUser(null);
        return;
      }
      
      // Now fetch additional profile data from profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      
      if (profileError) {
        console.error("Error fetching profile data:", profileError);
        // We can still continue with just the username data
      }
      
      // Create a complete user object combining both sources
      const completeUser: User = {
        id: userProfileData.id,
        username: userProfileData.username,
        name: profileData?.name || userProfileData.username,
        avatarUrl: profileData?.avatar_url || null,
        level: profileData?.level || 1,
        xp: profileData?.xp || 0,
        attributes: {
          strength: profileData?.strength || 1,
          vitality: profileData?.vitality || 1, 
          focus: profileData?.focus || 1
        },
        daysTrainedThisWeek: profileData?.days_trained_this_week || 0,
        streakDays: profileData?.streak_days || 0
      };
      
      setUser(completeUser);
    } catch (error) {
      console.error("Error in fetchProfile:", error);
      setUser(null);
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
        // Try to create a matching entry in the profiles table for backward compatibility
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
              streak_days: 0
            });
            
          if (profileError) {
            console.error("Error creating profile:", profileError);
          }
        } catch (err) {
          console.error("Error creating profile:", err);
        }
          
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

  const updateProfile = async (data: Partial<User>): Promise<{ success: boolean, error?: string }> => {
    try {
      if (!user?.id) {
        return { success: false, error: "Usuário não está autenticado" };
      }

      // Update the profiles table for compatibility with existing app
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
      if (data.level !== undefined) updateData.level = data.level;
      if (data.xp !== undefined) updateData.xp = data.xp;
      if (data.daysTrainedThisWeek !== undefined) updateData.days_trained_this_week = data.daysTrainedThisWeek;
      if (data.streakDays !== undefined) updateData.streak_days = data.streakDays;
      if (data.attributes?.strength !== undefined) updateData.strength = data.attributes.strength;
      if (data.attributes?.vitality !== undefined) updateData.vitality = data.attributes.vitality;
      if (data.attributes?.focus !== undefined) updateData.focus = data.attributes.focus;
      
      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", user.id);
          
        if (error) {
          console.error("Error updating profile:", error);
          return { success: false, error: error.message };
        }
      }
      
      // Update local user state
      setUser(prev => prev ? { ...prev, ...data } : null);
      return { success: true };
    } catch (error: any) {
      console.error("Error in updateProfile:", error);
      return { success: false, error: error.message || "Erro desconhecido" };
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register, updateProfile }}>
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

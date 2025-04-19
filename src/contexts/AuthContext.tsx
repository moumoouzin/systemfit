import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";

// Define user type
type User = {
  id: string;
  name: string;
  level: number;
  xp: number;
  avatarUrl: string;
  attributes: {
    strength: number;
    vitality: number;
    focus: number;
  };
  streakDays: number;
  daysTrainedThisWeek: number;
};

interface AuthContextType {
  user: User | null;
  profile: User | null; // Alias for user to maintain compatibility
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean, error?: string }>;
  register: (username: string, password: string, displayName?: string, additionalData?: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Check if there's a user in localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("systemFitUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    }
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Only accept Mohamed/isaque123 combination
      if (username === "Mohamed" && password === "isaque123") {
        // Create hardcoded user profile with a proper UUID
        const mohamedUser: User = {
          id: "d7bed83c-e21e-4ebe-9c17-4e1c06619950",
          name: "Mohamed",
          level: 1,
          xp: 0,
          avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Mohamed",
          attributes: {
            strength: 1,
            vitality: 1,
            focus: 1
          },
          streakDays: 0,
          daysTrainedThisWeek: 0
        };

        setUser(mohamedUser);
        localStorage.setItem("systemFitUser", JSON.stringify(mohamedUser));
        
        toast({
          title: "Login bem-sucedido",
          description: "Bem-vindo, Mohamed!",
        });
        
        navigate("/dashboard");
        return;
      }
      
      toast({
        title: "Credenciais inválidas",
        description: "Usuário ou senha incorretos.",
        variant: "destructive",
      });
      
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      toast({
        title: "Erro de login",
        description: "Ocorreu um erro ao tentar fazer login.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("systemFitUser");
    navigate("/login");
    toast({
      title: "Logout realizado",
      description: "Você saiu da sua conta com sucesso.",
    });
  };

  const updateProfile = async (data: Partial<User>): Promise<{ success: boolean, error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: "Usuário não autenticado" };
      }

      const updatedUser = { ...user, ...data };
      
      localStorage.setItem("systemFitUser", JSON.stringify(updatedUser));
      
      setUser(updatedUser);
      
      return { success: true };
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      return { success: false, error: "Falha ao atualizar perfil" };
    }
  };

  const register = async (
    username: string, 
    password: string, 
    displayName?: string, 
    additionalData?: Partial<User>
  ) => {
    setIsLoading(true);
    
    try {
      if (username === "Mohamed" && password === "isaque123") {
        const newUser: User = {
          id: "d7bed83c-e21e-4ebe-9c17-4e1c06619950",
          name: displayName || username,
          level: 1,
          xp: 0,
          avatarUrl: additionalData?.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg?seed=Mohamed",
          attributes: additionalData?.attributes || {
            strength: 1,
            vitality: 1,
            focus: 1
          },
          streakDays: 0,
          daysTrainedThisWeek: 0
        };
        
        setUser(newUser);
        localStorage.setItem("systemFitUser", JSON.stringify(newUser));
        
        toast({
          title: "Conta criada com sucesso",
          description: "Bem-vindo ao SystemFit!",
        });
        
        navigate("/dashboard");
      } else {
        toast({
          title: "Erro ao criar conta",
          description: "Apenas o usuário Mohamed com senha isaque123 é aceito.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao registrar:", error);
      toast({
        title: "Erro ao criar conta",
        description: "Ocorreu um erro ao tentar criar sua conta.",
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
        profile: user,
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

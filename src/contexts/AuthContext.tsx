
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { WorkoutHistory } from "@/types";

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

  // Função para calcular o XP total com base no histórico de treinos
  const calculateTotalXp = () => {
    const historyStr = localStorage.getItem('workoutHistory');
    if (!historyStr) return 0;
    
    try {
      const history: WorkoutHistory[] = JSON.parse(historyStr);
      return history.reduce((total, session) => total + (session.xpEarned || 0), 0);
    } catch (error) {
      console.error('Erro ao calcular XP total:', error);
      return 0;
    }
  };

  // Função para calcular o nível com base no XP total
  const calculateLevel = (xp: number) => {
    return Math.floor(xp / 100) + 1;
  };

  // Check if there's a user in localStorage on mount and calculate XP from history
  useEffect(() => {
    const storedUser = localStorage.getItem("systemFitUser");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // Calcular o XP total do histórico
        const totalXp = calculateTotalXp();
        const calculatedLevel = calculateLevel(totalXp);
        
        // Atualizar o usuário com o XP e nível calculados
        const updatedUser = {
          ...parsedUser,
          xp: totalXp,
          level: calculatedLevel
        };
        
        setUser(updatedUser);
        localStorage.setItem("systemFitUser", JSON.stringify(updatedUser));
      } catch (error) {
        console.error("Erro ao processar usuário:", error);
        setUser(null);
      }
    }
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Aceitar qualquer combinação de usuário/senha para facilitar testes
      const newUser: User = {
        id: uuidv4(),
        name: username,
        level: 1,
        xp: calculateTotalXp(), // Usar o XP do histórico
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        attributes: {
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
        title: "Login bem-sucedido",
        description: `Bem-vindo, ${username}!`,
      });
      
      navigate("/dashboard");
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
      const newUser: User = {
        id: uuidv4(),
        name: displayName || username,
        level: 1,
        xp: 0,
        avatarUrl: additionalData?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
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

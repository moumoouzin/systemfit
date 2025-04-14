
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from "uuid";

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
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Only accept Mohamed/isaque123 combination
      if (username === "Mohamed" && password === "isaque123") {
        // Create hardcoded user profile with a proper UUID
        const mohamedUser: User = {
          id: uuidv4(), // Generate a proper UUID
          name: "Mohamed",
          level: 5,
          xp: 750,
          avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Mohamed",
          attributes: {
            strength: 3,
            vitality: 3,
            focus: 3
          },
          streakDays: 5,
          daysTrainedThisWeek: 3
        };

        // Set user in state and local storage
        setUser(mohamedUser);
        localStorage.setItem("systemFitUser", JSON.stringify(mohamedUser));
        
        toast({
          title: "Login bem-sucedido",
          description: "Bem-vindo, Mohamed!",
        });
        
        navigate("/dashboard");
        return;
      }
      
      // Any other credentials are invalid
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

  // Add updateProfile function
  const updateProfile = async (data: Partial<User>): Promise<{ success: boolean, error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: "Usuário não autenticado" };
      }

      // Update the user object with the new data
      const updatedUser = { ...user, ...data };
      
      // Save to localStorage
      localStorage.setItem("systemFitUser", JSON.stringify(updatedUser));
      
      // Update state
      setUser(updatedUser);
      
      return { success: true };
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      return { success: false, error: "Falha ao atualizar perfil" };
    }
  };

  // Add register function for compatibility
  const register = async (
    username: string, 
    password: string, 
    displayName?: string, 
    additionalData?: Partial<User>
  ) => {
    setIsLoading(true);
    
    try {
      // In this simplified version, we'll just create a new user
      // For now, we'll only accept the hardcoded credentials
      if (username === "Mohamed" && password === "isaque123") {
        const newUser: User = {
          id: uuidv4(), // Generate a proper UUID
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
        
        // Set user in state and local storage
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
        profile: user, // Alias for backward compatibility
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


import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

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
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
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
        // Create hardcoded user profile
        const mohamedUser: User = {
          id: "mohamed-1",
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout
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

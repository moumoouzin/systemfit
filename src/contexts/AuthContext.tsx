
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Interface para o usuário autenticado
interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  level: number;
  xp: number;
  attributes: {
    strength: number;
    vitality: number;
    focus: number;
  };
  daysTrainedThisWeek: number;
  streakDays: number;
}

// Interface para o contexto de autenticação
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Criação do contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

// Mock de usuário inicial (apenas para desenvolvimento)
const mockUser: AuthUser = {
  id: "1",
  name: "Usuário Teste",
  email: "usuario@teste.com",
  avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  level: 5,
  xp: 120,
  attributes: {
    strength: 8,
    vitality: 7,
    focus: 6
  },
  daysTrainedThisWeek: 3,
  streakDays: 7
};

// Provedor de autenticação
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Verificar se há um usuário salvo no localStorage ao carregar
  useEffect(() => {
    const savedUser = localStorage.getItem("systemfit-user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // Função de login
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulação de autenticação (em produção, seria uma API real)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Validação simples (apenas para demonstração)
      if (email === "usuario@teste.com" && password === "123456") {
        setUser(mockUser);
        localStorage.setItem("systemfit-user", JSON.stringify(mockUser));
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo de volta ao SystemFit!",
        });
        navigate("/");
        return true;
      } else {
        toast({
          title: "Erro no login",
          description: "Email ou senha incorretos.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro ao tentar fazer login.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de registro
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulação de registro (em produção, seria uma API real)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Criando novo usuário
      const newUser: AuthUser = {
        ...mockUser,
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
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
      
      setUser(newUser);
      localStorage.setItem("systemfit-user", JSON.stringify(newUser));
      
      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao SystemFit!",
      });
      
      navigate("/");
      return true;
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro ao tentar criar sua conta.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem("systemfit-user");
    toast({
      title: "Logout realizado",
      description: "Você saiu da sua conta. Até breve!",
    });
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

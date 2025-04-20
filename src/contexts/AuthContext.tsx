
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/types";
import * as authFns from "./auth";
import * as profileFns from "./profile";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  register: (email: string, password: string, name: string | null) => Promise<{ error?: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // fetch profile helper for login
  const fetchProfile = async (id: string) => {
    try {
      await profileFns.fetchProfile(id, setUser);
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      setUser(null);
    }
  };

  useEffect(() => {
    // Verificar se há uma sessão existente
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      }
    };
    
    checkSession();

    // Configurar o listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = (email: string, password: string) => {
    return authFns.login(email, password, fetchProfile, navigate, setIsLoading);
  };

  const logout = () => {
    return authFns.logout(navigate, setUser);
  };

  const register = (email: string, password: string, name: string | null) => {
    return authFns.register(email, password, name, navigate, setIsLoading);
  };

  const updateProfile = (data: Partial<User>) => {
    return profileFns.updateProfile(user, setUser, data);
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

import React, { createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { authService } from "./authService";
import { useAuthState } from "./useAuthState";
import { AuthContextType } from "./types";
import { supabase } from "@/integrations/supabase/client";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, session, isLoading, setIsLoading } = useAuthState();
  const navigate = useNavigate();

  const login = async (emailOrUsername: string, password: string) => {
    try {
      setIsLoading(true);
      await authService.login(emailOrUsername, password);
      
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
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      await authService.loginWithGoogle();
      
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
    avatarUrl?: string | null
  ) => {
    try {
      setIsLoading(true);
      await authService.register(email, password, name, avatarUrl);

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
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
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
      const result = await authService.updateProfile(user.id, updateData);
      
      // Trigger a profile refetch
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
      if (error) throw error;
      
      return result;
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

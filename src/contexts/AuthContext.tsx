
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
      console.error("Error fetching profile:", error);
      setUser(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setIsLoading(true);
          await fetchProfile(session.user.id);
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    // Check for an existing session
    const checkSession = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
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


import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/types";
import * as authFns from "./auth";
import * as profileFns from "./profile";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  register: (username: string, password: string) => Promise<{ error?: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // fetch profile helper for login
  const fetchProfile = async (id: string) => {
    await profileFns.fetchProfile(id, setUser);
  };

  useEffect(() => {
    const sessionPromise = import("@/integrations/supabase/client").then((m) =>
      m.supabase.auth.getSession()
    );
    sessionPromise.then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });
    
    // Here's the fix - using the imported supabase client instead of require
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

  const login = (username: string, password: string) => {
    return authFns.login(username, password, fetchProfile, navigate, setIsLoading);
  };

  const logout = () => {
    return authFns.logout(navigate, setUser);
  };

  const register = (username: string, password: string) => {
    return authFns.register(username, password, navigate, setIsLoading);
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


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
  updateProfile: (data: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    let subscription: { unsubscribe: () => void } | null = null;
    let mounted = true;
    
    // Check for an existing session first
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error("Error getting session:", error);
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
        }
        
        if (mounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    // Set up auth state listener
    const setupAuthListener = () => {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;
          
          if (event === 'SIGNED_IN' && session?.user) {
            await fetchProfile(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            // Only fetch profile if we don't have user data
            if (!user) {
              await fetchProfile(session.user.id);
            }
          }
        }
      );
      
      return data.subscription;
    };
    
    checkSession().then(() => {
      if (mounted) {
        subscription = setupAuthListener();
      }
    });

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      return await authFns.login(email, password, fetchProfile, navigate, setIsLoading);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      return await authFns.logout(navigate, setUser);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string | null) => {
    setIsLoading(true);
    try {
      return await authFns.register(email, password, name, navigate, setIsLoading);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    const result = await profileFns.updateProfile(user, setUser, data);
    if (!result.success) {
      throw new Error(result.error || "Failed to update profile");
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

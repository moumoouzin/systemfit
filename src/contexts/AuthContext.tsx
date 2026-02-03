
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

  // Log mudanças de estado do usuário
  useEffect(() => {
    // console.log('👤 AuthContext - user state changed:', {
    //   hasUser: !!user,
    //   userId: user?.id,
    //   userName: user?.username,
    //   isLoading,
    //   timestamp: new Date().toISOString()
    // });
  }, [user, isLoading]);

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
    // console.log('🚀 AuthContext - component mounting, setting up auth...');
    let subscription: { unsubscribe: () => void } | null = null;
    let mounted = true;
    
    // Check for an existing session first
    const checkSession = async () => {
      // console.log('🔍 AuthContext - checking initial session...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // console.log('📡 AuthContext - session check result:', {
        //   hasSession: !!session,
        //   hasUser: !!session?.user,
        //   userId: session?.user?.id,
        //   error: error?.message,
        //   mounted,
        //   timestamp: new Date().toISOString()
        // });
        
        if (!mounted) {
          // console.log('❌ AuthContext - component unmounted during session check');
          return;
        }
        
        if (error) {
          console.error("❌ AuthContext - error getting session:", error);
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        if (session?.user) {
          // console.log('✅ AuthContext - session found, fetching profile');
          await fetchProfile(session.user.id);
        } else {
          // console.log('❌ AuthContext - no session found, clearing user');
          setUser(null);
        }
        
        if (mounted) {
          // console.log('✅ AuthContext - session check completed, setting loading to false');
          setIsLoading(false);
        }
      } catch (error) {
        console.error("❌ AuthContext - error checking session:", error);
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
          // console.log('🔐 AuthContext - auth state change:', {
          //   event,
          //   hasSession: !!session,
          //   hasUser: !!session?.user,
          //   userId: session?.user?.id,
          //   currentUser: user?.id,
          //   mounted,
          //   timestamp: new Date().toISOString()
          // });
          
          if (!mounted) {
            // console.log('❌ AuthContext - component unmounted, ignoring auth change');
            return;
          }
          
          if (event === 'SIGNED_IN' && session?.user) {
            // console.log('✅ AuthContext - user signed in, fetching profile');
            await fetchProfile(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            // console.log('❌ AuthContext - user signed out, clearing user');
            setUser(null);
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            // console.log('🔄 AuthContext - token refreshed');
            // Only fetch profile if we don't have user data
            if (!user) {
              // console.log('🔄 AuthContext - no user data, fetching profile');
              await fetchProfile(session.user.id);
            } else {
              // console.log('✅ AuthContext - user data already available');
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
      // console.log('💥 AuthContext - component unmounting, cleaning up...');
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
        // console.log('✅ AuthContext - auth subscription unsubscribed');
      }
    };
  }, []);

  // Escutar eventos de refresh para reconectar quando app volta do background
  useEffect(() => {
    const handleAppRefresh = async () => {
      // console.log('App foreground refresh - checking auth session');
      try {
        // Pequeno delay para garantir que a página esteja totalmente ativa
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session on refresh:", error);
          return;
        }
        
        if (session?.user) {
          if (!user) {
            // Se temos uma sessão mas não temos dados do usuário, buscar perfil
            // console.log('Session found but no user data - fetching profile');
            await fetchProfile(session.user.id);
          } else {
            // Se já temos usuário, apenas verificar se a sessão ainda é válida
            // console.log('User already loaded, session is valid');
          }
        } else {
          // Sem sessão, limpar usuário se existir
          if (user) {
            // console.log('No session found, clearing user');
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Error checking session on refresh:", error);
      }
    };

    const handleStateRecovery = async (event: CustomEvent) => {
      // console.log('App state recovery - checking auth session');
      try {
        const { session } = event.detail;
        
        if (session?.user) {
          if (!user) {
            // console.log('State recovery - fetching profile for user:', session.user.id);
            await fetchProfile(session.user.id);
          } else {
            // console.log('State recovery - user already loaded');
          }
        } else {
          // console.log('State recovery - no valid session');
          if (user) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Error during state recovery:", error);
      }
    };

    // Adicionar debounce para evitar múltiplas chamadas
    let refreshTimeout: NodeJS.Timeout;
    const debouncedRefresh = () => {
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(handleAppRefresh, 200);
    };

    window.addEventListener('app-foreground-refresh', debouncedRefresh);
    window.addEventListener('pwa-background-refresh', handleAppRefresh);
    window.addEventListener('app-state-recovery', handleStateRecovery as EventListener);

    return () => {
      clearTimeout(refreshTimeout);
      window.removeEventListener('app-foreground-refresh', debouncedRefresh);
      window.removeEventListener('pwa-background-refresh', handleAppRefresh);
      window.removeEventListener('app-state-recovery', handleStateRecovery as EventListener);
    };
  }, [user]);

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


import { useState, useEffect } from "react";
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import { User as AppUser } from "@/types";

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Configurar listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          try {
            await fetchUserProfile(session.user.id);
          } catch (error) {
            console.error("Erro ao buscar perfil após mudança de auth:", error);
            setIsLoading(false);
          }
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    // Verificar sessão atual
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        console.log("Sessão atual:", session?.user?.id);
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          try {
            await fetchUserProfile(session.user.id);
          } catch (error) {
            console.error("Erro ao buscar perfil na inicialização:", error);
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Buscando perfil para usuário ID:", userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error("Erro ao buscar perfil:", error);
        setIsLoading(false);
        throw error;
      }
      
      console.log("Dados do perfil recebidos:", data);
      
      if (data) {
        const userProfile: AppUser = {
          id: data.id,
          name: data.name,
          avatarUrl: data.avatar_url || "",
          level: data.level,
          xp: data.xp,
          attributes: {
            strength: data.strength,
            vitality: data.vitality,
            focus: data.focus
          },
          daysTrainedThisWeek: data.days_trained_this_week,
          streakDays: data.streak_days
        };
        
        console.log("Perfil configurado:", userProfile);
        setProfile(userProfile);
      } else {
        console.warn("Nenhum perfil encontrado para o usuário:", userId);
        setProfile(null);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      setIsLoading(false);
      throw error;
    }
  };

  return { user, profile, session, isLoading, setProfile, setIsLoading };
};

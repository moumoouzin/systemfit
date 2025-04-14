
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';

export const authService = {
  login: async (emailOrUsername: string, password: string) => {
    // Determinar se é um email ou nome de usuário
    const isEmail = emailOrUsername.includes('@');
    const email = isEmail ? emailOrUsername : `${emailOrUsername.toLowerCase()}@systemfit.com`;
    
    console.log("Tentando login com:", { email, isEmail });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    
    console.log("Login bem-sucedido:", data.user?.id);
    return data;
  },

  loginWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) throw error;
  },

  register: async (
    email: string,
    password: string,
    name: string,
    avatarUrl?: string | null
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          avatar_url: avatarUrl || null
        },
      },
    });

    if (error) throw error;
    return data;
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  updateProfile: async (userId: string, updateData: Record<string, unknown>) => {
    const { error } = await supabase
      .from('profiles')
      .update(updateData as any)
      .eq('id', userId);
    
    if (error) throw error;
    
    return { success: true };
  }
};

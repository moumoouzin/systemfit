import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";
import { toast } from "@/hooks/use-toast";

// Calculate level based on XP
export const calculateLevel = (xp: number): number => {
  const xpForNextLevel = 200;
  return Math.max(1, Math.floor(xp / xpForNextLevel) + 1);
};

export const fetchProfile = async (
  id: string, 
  setUser: (user: User | null) => void
) => {
  try {
    // Verificar a sessão atual primeiro
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // console.log("No active session found during fetchProfile");
      setUser(null);
      return;
    }

    // Check if we have a user profile - aguardar um pouco para o trigger criar o perfil
    // console.log("Fetching user profile for ID:", id);
    
    let userProfileData = null;
    let attempts = 0;
    const maxAttempts = 5;
    
    // Tentar buscar o perfil algumas vezes caso o trigger ainda não tenha executado
    while (!userProfileData && attempts < maxAttempts) {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, username")
        .eq("id", id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching user profile:", error);
        setUser(null);
        return;
      }

      if (data) {
        userProfileData = data;
        break;
      }

      // Se não encontrou, aguardar um pouco antes de tentar novamente
      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Se ainda não existe após as tentativas, significa que algo deu errado
    if (!userProfileData) {
      // console.log("User profile not found after multiple attempts");
      setUser(null);
      return;
    }

    // Found user profile, now get profile data
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching profile data:", profileError);
    }

    if (!profileData) {
      // Profile data not found, create it
      // console.log("Creating new profile data for user");
      try {
        const { error: insertProfileError } = await supabase
          .from("profiles")
          .insert({
            id: id,
            name: userProfileData.username,
          });
          
        if (insertProfileError) {
          console.error("Error creating profile:", insertProfileError);
        }
      } catch (e) {
        console.error("Failed to create profile:", e);
      }
    }

    const xp = profileData?.xp || 0;
    const calculatedLevel = calculateLevel(xp);

    // Construct the user object with available data
    const completeUser: User = {
      id: userProfileData.id,
      username: userProfileData.username,
      name: profileData?.name || userProfileData.username,
      avatarUrl: profileData?.avatar_url || null,
      level: calculatedLevel, // Use calculated level instead of stored level
      xp: xp,
      attributes: {
        strength: profileData?.strength || 1,
        vitality: profileData?.vitality || 1,
        focus: profileData?.focus || 1,
      },
      daysTrainedThisWeek: profileData?.days_trained_this_week || 0,
      streakDays: profileData?.streak_days || 0,
    };
    setUser(completeUser);
  } catch (error) {
    console.error("Error in fetchProfile:", error);
    setUser(null);
  }
};

export const updateProfile = async (
  user: User | null, 
  setUser: (fn: (prev: User | null) => User | null) => void,
  data: Partial<User>
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!user?.id) {
      return { success: false, error: "Usuário não está autenticado" };
    }
    
    // Verify current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error("Authentication error:", sessionError);
      toast({
        title: "Erro de autenticação",
        description: "Sua sessão expirou. Por favor, faça login novamente.",
        variant: "destructive",
      });
      return { success: false, error: "Erro de autenticação. Faça login novamente." };
    }
    
    // console.log("Updating profile with data:", data);
    
    const updateData: any = {};
    
    // If XP is updated, calculate the new level
    if (data.xp !== undefined) {
      const newXP = data.xp;
      const calculatedLevel = calculateLevel(newXP);
      
      updateData.xp = newXP;
      updateData.level = calculatedLevel;
      
      // Also update the level in our data object
      data.level = calculatedLevel;
      
      console.log(`XP updated to ${newXP}, new level calculated as ${calculatedLevel}`);
    } else {
      // Handle other profile updates
      if (data.name !== undefined) updateData.name = data.name;
      if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
      if (data.level !== undefined) updateData.level = data.level;
      if (data.daysTrainedThisWeek !== undefined) updateData.days_trained_this_week = data.daysTrainedThisWeek;
      if (data.streakDays !== undefined) updateData.streak_days = data.streakDays;
      if (data.attributes?.strength !== undefined) updateData.strength = data.attributes.strength;
      if (data.attributes?.vitality !== undefined) updateData.vitality = data.attributes.vitality;
      if (data.attributes?.focus !== undefined) updateData.focus = data.attributes.focus;
    }

    console.log("Translated update data:", updateData);
    
    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile:", error);
        toast({
          title: "Erro ao atualizar perfil",
          description: error.message || "Ocorreu um erro ao atualizar seu perfil",
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }
    }
    
    // console.log("Profile updated successfully, updating state");
    
    setUser((prev) => {
      if (!prev) return null;
      
      const updated = { ...prev, ...data };
      // console.log("New user state:", updated);
      return updated;
    });
    
    return { success: true };
  } catch (error: any) {
    console.error("Error in updateProfile:", error);
    toast({
      title: "Erro ao atualizar perfil",
      description: error.message || "Ocorreu um erro desconhecido",
      variant: "destructive",
    });
    return { success: false, error: error.message || "Erro desconhecido" };
  }
};

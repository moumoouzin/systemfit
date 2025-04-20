
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";

export const fetchProfile = async (
  id: string, 
  setUser: (user: User | null) => void
) => {
  try {
    const { data: userProfileData, error: userProfileError } = await supabase
      .from("user_profiles")
      .select("id, username")
      .eq("id", id)
      .single();

    if (userProfileError) {
      console.error("Error fetching user profile:", userProfileError);
      setUser(null);
      return;
    }

    if (!userProfileData) {
      console.error("No user profile found");
      setUser(null);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching profile data:", profileError);
    }

    const completeUser: User = {
      id: userProfileData.id,
      username: userProfileData.username,
      name: profileData?.name || userProfileData.username,
      avatarUrl: profileData?.avatar_url || null,
      level: profileData?.level || 1,
      xp: profileData?.xp || 0,
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
    
    // Verifica se o usuário está autenticado no Supabase
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error("Erro de autenticação:", sessionError);
      return { success: false, error: "Erro de autenticação. Faça login novamente." };
    }
    
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.xp !== undefined) updateData.xp = data.xp;
    if (data.daysTrainedThisWeek !== undefined) updateData.days_trained_this_week = data.daysTrainedThisWeek;
    if (data.streakDays !== undefined) updateData.streak_days = data.streakDays;
    if (data.attributes?.strength !== undefined) updateData.strength = data.attributes.strength;
    if (data.attributes?.vitality !== undefined) updateData.vitality = data.attributes.vitality;
    if (data.attributes?.focus !== undefined) updateData.focus = data.attributes.focus;

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile:", error);
        return { success: false, error: error.message };
      }
    }

    setUser((prev) => (prev ? { ...prev, ...data } : null));
    return { success: true };
  } catch (error: any) {
    console.error("Error in updateProfile:", error);
    return { success: false, error: error.message || "Erro desconhecido" };
  }
};

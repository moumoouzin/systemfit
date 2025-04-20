
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";
import { toast } from "@/components/ui/use-toast";

export const fetchProfile = async (
  id: string, 
  setUser: (user: User | null) => void
) => {
  try {
    // Verificar a sessão atual primeiro
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log("No active session found during fetchProfile");
      setUser(null);
      return;
    }

    // Check if we have a user profile
    console.log("Fetching user profile for ID:", id);
    const { data: userProfileData, error: userProfileError } = await supabase
      .from("user_profiles")
      .select("id, username")
      .eq("id", id)
      .single();

    if (userProfileError) {
      console.error("Error fetching user profile:", userProfileError);
      if (userProfileError.code === "PGRST116") {
        // No profile found - this is a new user
        console.log("No user profile found, user might be new");
        
        // Use the session user's email as a fallback username
        const email = session.user.email;
        const username = email ? email.split('@')[0] : `user_${id.substring(0, 8)}`;
        
        try {
          // Create user_profile for new user
          const { error: insertError } = await supabase
            .from("user_profiles")
            .insert({
              id: id,
              username: username
            });
            
          if (insertError) throw insertError;
          
          // Now we created the profile, set basic user data
          setUser({
            id: id,
            username: username,
            name: username,
            avatarUrl: null,
            level: 1,
            xp: 0,
            attributes: {
              strength: 1,
              vitality: 1,
              focus: 1,
            },
            daysTrainedThisWeek: 0,
            streakDays: 0,
          });
          return;
        } catch (err) {
          console.error("Failed to create user profile:", err);
          setUser(null);
          return;
        }
      } else {
        setUser(null);
        return;
      }
    }

    // Found user profile, now get profile data
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching profile data:", profileError);
    }

    if (profileError && profileError.code === "PGRST116") {
      // Profile data not found, create it
      console.log("Creating new profile data for user");
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

    // Construct the user object with available data
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
        toast({
          title: "Erro ao atualizar perfil",
          description: error.message || "Ocorreu um erro ao atualizar seu perfil",
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }
    }

    setUser((prev) => (prev ? { ...prev, ...data } : null));
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

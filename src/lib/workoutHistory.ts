
import { supabase } from "@/integrations/supabase/client";
import { WorkoutHistory } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Database } from "@/types/database.types";

// Define the type for workout_sessions table data
type WorkoutSessionRow = Database['public']['Tables']['workout_sessions']['Row'] & {
  workouts: {
    name: string;
  } | null;
}

export const useWorkoutHistory = () => {
  const { profile } = useAuth();
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkoutHistory = async () => {
      setIsLoading(true);
      try {
        if (!profile?.id) {
          setWorkoutHistory([]);
          return;
        }
        
        // Fetch workout sessions from Supabase
        const { data: sessionData, error: sessionError } = await supabase
          .from('workout_sessions')
          .select(`
            id,
            date,
            completed,
            workout_id,
            xp_earned,
            workouts (
              name
            )
          `)
          .eq('user_id', profile.id)
          .order('date', { ascending: false });
        
        if (sessionError) {
          throw new Error(`Error fetching workout sessions: ${sessionError.message}`);
        }
        
        // Transform the data to match our WorkoutHistory type
        const formattedHistory: WorkoutHistory[] = (sessionData as WorkoutSessionRow[]).map(session => ({
          date: session.date,
          workoutId: session.workout_id,
          workoutName: session.workouts?.name || "Treino sem nome",
          completed: session.completed,
          xpEarned: session.xp_earned || 25, // Use the database value or default to 25
        }));
        
        setWorkoutHistory(formattedHistory);
      } catch (error) {
        console.error("Error fetching workout history:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
        setWorkoutHistory([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorkoutHistory();
  }, [profile]);
  
  return { workoutHistory, isLoading, error };
};

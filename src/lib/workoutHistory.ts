
import { supabase } from "@/integrations/supabase/client";
import { WorkoutHistory, WorkoutExerciseHistory } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Database } from "@/types/database.types";

// Define the type for workout_sessions table data with the joined workouts data
type WorkoutSessionWithWorkout = Database['public']['Tables']['workout_sessions']['Row'] & {
  workouts: {
    name: string;
    exercises: {
      id: string;
      name: string;
      sets: number;
      reps: number | string;
      exercise_weights: {
        weight: number;
        created_at: string;
      }[];
    }[];
  } | null;
};

// Define a type for the exercise in the Json array
interface ExerciseJson {
  id: string;
  name: string;
  sets: number;
  reps: number | string;
  weight: number;
  completed: boolean;
}

export const useWorkoutHistory = () => {
  const { user } = useAuth();
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkoutHistory = async () => {
      setIsLoading(true);
      try {
        if (!user?.id) {
          setWorkoutHistory([]);
          setIsLoading(false);
          return;
        }
        
        // Fetch workout sessions with exercises and weights
        const { data: sessionData, error: sessionError } = await supabase
          .from('workout_sessions')
          .select(`
            *,
            workouts (
              name,
              exercises (
                id,
                name,
                sets,
                reps,
                exercise_weights (
                  weight,
                  created_at
                )
              )
            )
          `)
          .eq('user_id', user.id)
          .order('date', { ascending: false });
        
        if (sessionError) {
          throw new Error(`Error fetching workout sessions: ${sessionError.message}`);
        }
        
        // Transform the data to match our WorkoutHistory type
        const formattedHistory: WorkoutHistory[] = (sessionData as WorkoutSessionWithWorkout[]).map(session => {
          let exercises: WorkoutExerciseHistory[] = [];
          
          // If we have the exercises directly in the session data (from our new format)
          if (session.exercises && Array.isArray(session.exercises) && session.exercises.length > 0) {
            exercises = session.exercises.map(ex => {
              // Type cast the Json to our ExerciseJson interface
              const exerciseData = ex as unknown as ExerciseJson;
              return {
                id: exerciseData.id || '',
                name: exerciseData.name || '',
                sets: exerciseData.sets || 0,
                reps: String(exerciseData.reps || 0),
                weight: exerciseData.weight || 0,
                completed: exerciseData.completed || false
              };
            });
          }
          // Fallback to the old format if no exercises in session data
          else if (session.workouts?.exercises) {
            exercises = session.workouts.exercises.map(exercise => ({
              id: exercise.id,
              name: exercise.name,
              sets: exercise.sets,
              reps: String(exercise.reps),
              weight: exercise.exercise_weights?.[0]?.weight || 0,
              completed: true // We assume that if the exercise is registered, it was completed
            }));
          }

          return {
            id: session.id,
            date: session.date,
            workoutId: session.workout_id,
            workoutName: session.workouts?.name || "Treino sem nome",
            completed: session.completed,
            xpEarned: session.xp_earned || 25,
            exercises: exercises,
            notes: session.notes || ""
          };
        });
        
        setWorkoutHistory(formattedHistory);
        localStorage.setItem(`workoutHistory_${user.id}`, JSON.stringify(formattedHistory));
        
      } catch (error) {
        console.error("Error fetching workout history:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
        setWorkoutHistory([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Try to load data from localStorage first
    const loadFromLocalStorage = () => {
      if (user?.id) {
        const localHistoryStr = localStorage.getItem(`workoutHistory_${user.id}`);
        if (localHistoryStr) {
          try {
            const localHistory = JSON.parse(localHistoryStr);
            setWorkoutHistory(localHistory);
            return true;
          } catch (e) {
            console.error("Failed to parse localStorage history:", e);
          }
        }
      }
      return false;
    };
    
    // First try loading from localStorage, then fetch from API
    const loadedFromStorage = loadFromLocalStorage();
    // If we couldn't load from storage or there was no data, fetch from API
    if (!loadedFromStorage) {
      fetchWorkoutHistory();
    } else {
      // Even if we loaded from storage, still fetch latest data in the background
      fetchWorkoutHistory();
    }
  }, [user]);
  
  return { workoutHistory, isLoading, error };
};

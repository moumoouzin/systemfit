
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
                  created_at,
                  is_latest
                )
              )
            )
          `)
          .eq('user_id', user.id)
          .order('date', { ascending: false });
        
        if (sessionError) {
          throw new Error(`Error fetching workout sessions: ${sessionError.message}`);
        }
        
        if (!sessionData || sessionData.length === 0) {
          setWorkoutHistory([]);
          setIsLoading(false);
          return;
        }
        
        // Transform the data to match our WorkoutHistory type
        const formattedHistory: WorkoutHistory[] = [];
        
        for (const session of sessionData as WorkoutSessionWithWorkout[]) {
          let exercises: WorkoutExerciseHistory[] = [];
          
          // If we have the exercises directly in the session data (from our new format)
          if (session.exercises && Array.isArray(session.exercises) && session.exercises.length > 0) {
            exercises = session.exercises.map(ex => {
              // Type cast the Json to our new exercise structure
              const exerciseData = ex as any;
              
              // Calculate average weight from setsPerformed if available
              let averageWeight = 0;
              if (exerciseData.setsPerformed && Array.isArray(exerciseData.setsPerformed)) {
                const completedSets = exerciseData.setsPerformed.filter((set: any) => set.completed && set.weight > 0);
                if (completedSets.length > 0) {
                  const totalWeight = completedSets.reduce((sum: number, set: any) => sum + set.weight, 0);
                  averageWeight = totalWeight / completedSets.length;
                }
              }
              
              return {
                id: exerciseData.id || '',
                name: exerciseData.name || '',
                sets: exerciseData.sets || 0,
                reps: String(exerciseData.reps || 0),
                weight: averageWeight,
                completed: exerciseData.completed || false,
                setsPerformed: exerciseData.setsPerformed || []
              };
            });
          }
          // Fallback to the old format if no exercises in session data
          else if (session.workouts?.exercises) {
            // Get latest weights for all exercises in this workout
            const exerciseIds = session.workouts.exercises.map(ex => ex.id);
            let exerciseWeights: any = {};
            
            if (exerciseIds.length > 0) {
              try {
                const { data: weightsData } = await supabase
                  .from('exercise_weights')
                  .select('exercise_id, weight')
                  .in('exercise_id', exerciseIds)
                  .eq('user_id', user.id)
                  .eq('is_latest', true);
                
                if (weightsData) {
                  weightsData.forEach(w => {
                    exerciseWeights[w.exercise_id] = w.weight;
                  });
                }
              } catch (error) {
                console.error('Error fetching weights:', error);
              }
            }
            
            exercises = session.workouts.exercises.map(exercise => {
              const weight = exerciseWeights[exercise.id] || 0;
              
              // Also check if weight is in the exercise_weights array directly
              const directWeight = exercise.exercise_weights?.find(w => w.is_latest)?.weight || 
                                 exercise.exercise_weights?.[0]?.weight || 0;
              
              const finalWeight = weight || directWeight;
              
              return {
                id: exercise.id,
                name: exercise.name,
                sets: exercise.sets,
                reps: String(exercise.reps),
                weight: finalWeight,
                completed: true, // We assume that if the exercise is registered, it was completed
                setsPerformed: []
              };
            });
          }
          
          formattedHistory.push({
            id: session.id,
            date: session.date,
            workoutId: session.workout_id,
            workoutName: session.workouts?.name || "Treino sem nome",
            completed: session.completed,
            xpEarned: session.xp_earned || 25,
            exercises: exercises,
            notes: session.notes || ""
          });
        }
        
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

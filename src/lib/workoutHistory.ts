
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
  console.log('🚀 useWorkoutHistory hook called');
  const { user } = useAuth();
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  console.log('👤 Current user in useWorkoutHistory:', user?.id);

  useEffect(() => {
    console.log('⚡ useEffect triggered in useWorkoutHistory, user:', user?.id);
    
    const fetchWorkoutHistory = async () => {
      console.log('🔄 fetchWorkoutHistory called');
      setIsLoading(true);
      try {
        if (!user?.id) {
          console.log('❌ No user ID found, aborting fetch');
          setWorkoutHistory([]);
          setIsLoading(false);
          return;
        }
        
        console.log('✅ User ID found, proceeding with fetch:', user.id);
        
        // Fetch workout sessions with exercises and weights
        console.log('🔍 Fetching workout sessions for user:', user.id);
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
          console.error('❌ Error fetching workout sessions:', sessionError);
          throw new Error(`Error fetching workout sessions: ${sessionError.message}`);
        }
        
        console.log('✅ Raw session data from DB:', JSON.stringify(sessionData, null, 2));
        console.log('📊 Session data length:', sessionData?.length);
        
        if (!sessionData || sessionData.length === 0) {
          console.log('⚠️ No session data found, setting empty history');
          setWorkoutHistory([]);
          setIsLoading(false);
          return;
        }
        
        // Transform the data to match our WorkoutHistory type
        const formattedHistory: WorkoutHistory[] = [];
        
        for (const session of sessionData as WorkoutSessionWithWorkout[]) {
          let exercises: WorkoutExerciseHistory[] = [];
          
          console.log('🔄 Processing session:', session.id);
          console.log('📊 Session exercises data type:', typeof session.exercises);
          console.log('📊 Session exercises is array:', Array.isArray(session.exercises));
          console.log('📊 Session exercises length:', session.exercises?.length);
          console.log('📊 Session exercises raw:', session.exercises);
          
          // If we have the exercises directly in the session data (from our new format)
          if (session.exercises && Array.isArray(session.exercises) && session.exercises.length > 0) {
            console.log('✅ Using NEW FORMAT (setsPerformed) for session:', session.id);
            exercises = session.exercises.map(ex => {
              // Type cast the Json to our new exercise structure
              const exerciseData = ex as any;
              
              console.log('🏋️ Processing exercise:', exerciseData.name);
              console.log('🏋️ Exercise raw data:', JSON.stringify(exerciseData, null, 2));
              console.log('🏋️ setsPerformed type:', typeof exerciseData.setsPerformed);
              console.log('🏋️ setsPerformed is array:', Array.isArray(exerciseData.setsPerformed));
              console.log('🏋️ setsPerformed data:', exerciseData.setsPerformed);
              
              // Calculate average weight from setsPerformed if available
              let averageWeight = 0;
              if (exerciseData.setsPerformed && Array.isArray(exerciseData.setsPerformed)) {
                const allSets = exerciseData.setsPerformed;
                const completedSets = allSets.filter((set: any) => set.completed && set.weight > 0);
                console.log('📈 All sets for', exerciseData.name, ':', allSets);
                console.log('✅ Completed sets for', exerciseData.name, ':', completedSets);
                
                if (completedSets.length > 0) {
                  const totalWeight = completedSets.reduce((sum: number, set: any) => sum + set.weight, 0);
                  averageWeight = totalWeight / completedSets.length;
                  console.log('⚖️ Total weight:', totalWeight, 'Average weight for', exerciseData.name, ':', averageWeight);
                } else {
                  console.log('⚠️ No completed sets with weight > 0 for', exerciseData.name);
                }
              } else {
                console.log('❌ No setsPerformed data for', exerciseData.name);
              }
              
              const result = {
                id: exerciseData.id || '',
                name: exerciseData.name || '',
                sets: exerciseData.sets || 0,
                reps: String(exerciseData.reps || 0),
                weight: averageWeight,
                completed: exerciseData.completed || false,
                setsPerformed: exerciseData.setsPerformed || []
              };
              
              console.log('🎯 Final exercise result for', exerciseData.name, ':', result);
              return result;
            });
          }
          // Fallback to the old format if no exercises in session data
          else if (session.workouts?.exercises) {
            console.log('🔄 Using OLD FORMAT (exercise_weights) for session:', session.id);
            console.log('🔄 Workout data:', session.workouts);
            console.log('🔄 Exercises in workout:', session.workouts.exercises);
            
            // Get latest weights for all exercises in this workout
            const exerciseIds = session.workouts.exercises.map(ex => ex.id);
            console.log('🔍 Exercise IDs to lookup weights for:', exerciseIds);
            let exerciseWeights: any = {};
            
            if (exerciseIds.length > 0) {
              try {
                console.log('🔍 Fetching weights from exercise_weights table...');
                const { data: weightsData, error: weightsError } = await supabase
                  .from('exercise_weights')
                  .select('exercise_id, weight')
                  .in('exercise_id', exerciseIds)
                  .eq('user_id', user.id)
                  .eq('is_latest', true);
                
                if (weightsError) {
                  console.error('❌ Error fetching weights:', weightsError);
                } else {
                  console.log('✅ Weights data from DB:', weightsData);
                  if (weightsData) {
                    weightsData.forEach(w => {
                      exerciseWeights[w.exercise_id] = w.weight;
                      console.log('💾 Stored weight for exercise', w.exercise_id, ':', w.weight);
                    });
                  }
                }
              } catch (error) {
                console.error('❌ Exception fetching weights:', error);
              }
            }
            
            console.log('📊 Final exercise weights mapping:', exerciseWeights);
            
            exercises = session.workouts.exercises.map(exercise => {
              const weight = exerciseWeights[exercise.id] || 0;
              console.log('🏋️ Exercise:', exercise.name, 'ID:', exercise.id, 'weight from DB:', weight);
              
              // Also check if weight is in the exercise_weights array directly
              const directWeight = exercise.exercise_weights?.find(w => w.is_latest)?.weight || 
                                 exercise.exercise_weights?.[0]?.weight || 0;
              console.log('🏋️ Direct weight from exercise.exercise_weights:', directWeight);
              
              const finalWeight = weight || directWeight;
              console.log('🏋️ Final weight chosen:', finalWeight);
              
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
          } else {
            console.log('❌ No exercises found in session:', session.id);
          }
          
          const sessionResult = {
            id: session.id,
            date: session.date,
            workoutId: session.workout_id,
            workoutName: session.workouts?.name || "Treino sem nome",
            completed: session.completed,
            xpEarned: session.xp_earned || 25,
            exercises: exercises,
            notes: session.notes || ""
          };
          
          console.log('📝 Final session result:', sessionResult);
          formattedHistory.push(sessionResult);
        }
        
        console.log('🎉 Final formatted history:', formattedHistory);
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
    
    // TEMPORARILY DISABLED localStorage to force fresh data fetch
    console.log('🔄 Forcing fresh data fetch (localStorage disabled for debugging)');
    fetchWorkoutHistory();
  }, [user]);
  
  return { workoutHistory, isLoading, error };
};

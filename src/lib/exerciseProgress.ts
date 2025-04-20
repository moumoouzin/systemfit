
import { supabase } from "@/integrations/supabase/client";
import { ExerciseProgress } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Database } from "@/types/database.types";

// Define the type for exercise data with weights
type ExerciseWithWeights = Database['public']['Tables']['exercises']['Row'] & {
  exercise_weights: {
    weight: number;
    created_at: string;
    is_latest: boolean;
  }[];
}

export const useExerciseProgress = () => {
  const { user } = useAuth();
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExerciseProgress = async () => {
      setIsLoading(true);
      try {
        if (!user?.id) {
          setExerciseProgress([]);
          return;
        }
        
        // Fetch exercises with weights from Supabase
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select(`
            id,
            name,
            exercise_weights (
              weight,
              created_at,
              is_latest
            )
          `)
          .order('name');
        
        if (exercisesError) {
          throw new Error(`Error fetching exercises: ${exercisesError.message}`);
        }
        
        // Process and transform the data
        const progress: ExerciseProgress[] = [];
        
        for (const exercise of exercisesData as ExerciseWithWeights[]) {
          if (!exercise.exercise_weights || exercise.exercise_weights.length < 2) {
            continue; // Skip exercises with insufficient data
          }
          
          // Sort weights by date, newest first
          const sortedWeights = [...exercise.exercise_weights].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
          // Get latest and previous weights
          const currentWeight = sortedWeights[0];
          const previousWeight = sortedWeights[1];
          
          if (currentWeight && previousWeight) {
            const currentWeightValue = Number(currentWeight.weight);
            const previousWeightValue = Number(previousWeight.weight);
            
            let progressStatus: 'increased' | 'decreased' | 'maintained' = 'maintained';
            if (currentWeightValue > previousWeightValue) {
              progressStatus = 'increased';
            } else if (currentWeightValue < previousWeightValue) {
              progressStatus = 'decreased';
            }
            
            progress.push({
              exercise: exercise.name,
              currentWeek: {
                weight: currentWeightValue,
                sets: 3, // Default values
                totalReps: 30, // Default values
              },
              previousWeek: {
                weight: previousWeightValue,
                sets: 3, // Default values
                totalReps: 30, // Default values
              },
              progress: progressStatus
            });
          }
        }
        
        setExerciseProgress(progress);
      } catch (error) {
        console.error("Error fetching exercise progress:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
        setExerciseProgress([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExerciseProgress();
  }, [user]);
  
  return { exerciseProgress, isLoading, error };
};

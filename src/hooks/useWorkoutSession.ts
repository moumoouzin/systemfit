
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Workout, Exercise, ExerciseStatus } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface UseWorkoutSessionProps {
  workoutId?: string;
}

export const useWorkoutSession = ({ workoutId }: UseWorkoutSessionProps = {}) => {
  const { user, updateProfile } = useAuth();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exerciseStatus, setExerciseStatus] = useState<ExerciseStatus[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadWorkout = async () => {
      setIsLoading(true);
      try {
        if (!user?.id) {
          setWorkout(null);
          setExercises([]);
          return;
        }

        if (!workoutId) {
          console.warn("Workout ID is missing.");
          return;
        }

        const { data: workoutData, error: workoutError } = await supabase
          .from('workouts')
          .select(`
            *,
            exercises (*)
          `)
          .eq('id', workoutId)
          .eq('user_id', user.id)
          .single();

        if (workoutError) {
          console.error("Error fetching workout:", workoutError);
          throw workoutError;
        }

        if (workoutData) {
          // Transform the workout data from Supabase format to our app format
          const formattedExercises: Exercise[] = workoutData.exercises.map((ex: any) => ({
            id: ex.id,
            name: ex.name,
            sets: ex.sets,
            // Handle reps as either string or number
            reps: typeof ex.reps === 'string' ? ex.reps : ex.reps.toString()
          }));

          const formattedWorkout: Workout = {
            id: workoutData.id,
            name: workoutData.name,
            exercises: formattedExercises,
            createdAt: workoutData.created_at,
            updatedAt: workoutData.updated_at
          };

          setWorkout(formattedWorkout);
          setExercises(formattedExercises);
          
          // Initialize exercise status and fetch previous weights
          await initializeExerciseStatus(formattedExercises);
        } else {
          setWorkout(null);
          setExercises([]);
        }
      } catch (error) {
        console.error("Error loading workout:", error);
        setError("Failed to load workout.");
        toast({
          title: "Erro ao carregar treino",
          description: "Não foi possível carregar o treino.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkout();
  }, [workoutId, user]);

  const fetchPreviousWeights = async (exercises: Exercise[]) => {
    if (!user?.id) return {};
    
    try {
      const exerciseIds = exercises.map(ex => ex.id);
      
      // Get the latest weight for each exercise
      const { data, error } = await supabase
        .from('exercise_weights')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_latest', true)
        .in('exercise_id', exerciseIds);
      
      if (error) {
        console.error("Error fetching previous weights:", error);
        return {};
      }
      
      // Create a map of exercise_id -> weight
      const weightMap: Record<string, number> = {};
      if (data) {
        data.forEach(record => {
          weightMap[record.exercise_id] = record.weight;
        });
      }
      
      return weightMap;
    } catch (error) {
      console.error("Error in fetchPreviousWeights:", error);
      return {};
    }
  };

  const initializeExerciseStatus = async (exercisesList: Exercise[]) => {
    // Fetch previous weights for all exercises
    const previousWeights = await fetchPreviousWeights(exercisesList);
    
    const initialStatus: ExerciseStatus[] = exercisesList.map(exercise => ({
      id: exercise.id,
      completed: false,
      weight: 0,
      previousWeight: previousWeights[exercise.id] || 0, // Add previous weight
    }));
    
    setExerciseStatus(initialStatus);
  };

  const toggleExerciseCompletion = (id: string) => {
    setExerciseStatus(prev => 
      prev.map(status => 
        status.id === id ? { ...status, completed: !status.completed } : status
      )
    );
  };

  const updateWeight = (id: string, weight: number) => {
    setExerciseStatus(prev => 
      prev.map(status => 
        status.id === id ? { ...status, weight } : status
      )
    );
  };

  const updateExerciseNotes = (id: string, notes: string) => {
    setExercises(prevExercises =>
      prevExercises.map(ex => (ex.id === id ? { ...ex, notes } : ex))
    );
  };

  const updateExercise = (id: string, updates: Partial<Exercise>) => {
    setExercises(prevExercises =>
      prevExercises.map(ex => (ex.id === id ? { ...ex, ...updates } : ex))
    );
  };

  const completeWorkout = async () => {
    if (!user?.id || !workout) return;
    
    try {
      // Calculate XP: 25 XP per completed exercise
      const completedExercises = exerciseStatus.filter(ex => ex.completed).length;
      const xpEarned = completedExercises * 25;
      
      // Map completed exercises with their weights and notes
      const exerciseDetails = exercises.map(exercise => {
        const status = exerciseStatus.find(s => s.id === exercise.id);
        return {
          id: exercise.id,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: status?.weight || 0,
          completed: status?.completed || false,
          notes: exercise.notes || ""
        };
      });
      
      // Create workout session with all data including exercises in one request
      const sessionData = {
        user_id: user.id,
        workout_id: workout.id,
        completed: true,
        xp_earned: xpEarned,
        notes: notes,
        exercises: exerciseDetails // Make sure this matches the database column
      };
      
      console.log("Creating workout session with data:", sessionData);
      
      // Insert the session with all data at once
      const { data: sessionInsertData, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert(sessionData)
        .select('id')
        .single();

      if (sessionError) {
        console.error('Session insert error:', sessionError);
        throw sessionError;
      }
      
      // Update user's XP
      await updateProfile({
        xp: (user.xp || 0) + xpEarned
      });

      toast({
        title: "Treino concluído!",
        description: `Você ganhou ${xpEarned} XP!`,
      });

      // Also store exercise weights for historical tracking
      const completedExerciseStatuses = exerciseStatus.filter(status => status.completed);
      for (const status of completedExerciseStatuses) {
        if (status.weight > 0) {
          try {
            // First set all existing weights for this exercise to not latest
            await supabase
              .from('exercise_weights')
              .update({ is_latest: false })
              .eq('exercise_id', status.id)
              .eq('user_id', user.id);
            
            // Then insert the new weight as the latest
            await supabase
              .from('exercise_weights')
              .insert({
                exercise_id: status.id,
                user_id: user.id,
                weight: status.weight,
                is_latest: true
              });
          } catch (weightError) {
            console.error('Error updating exercise weight:', weightError);
            // Continue despite weight tracking errors
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error completing workout:', error);
      toast({
        title: "Erro ao concluir treino",
        description: "Não foi possível salvar o treino.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const handleFinishWorkout = async () => {
    setIsSubmitting(true);
    try {
      const result = await completeWorkout();
      return result;
    } catch (error) {
      console.error('Error finishing workout:', error);
      return { success: false, error };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    workout,
    exercises,
    isLoading,
    error,
    updateExercise,
    completeWorkout,
    notes,
    setNotes,
    exerciseStatus,
    isSubmitting,
    initializeExerciseStatus,
    toggleExerciseCompletion,
    updateWeight,
    updateExerciseNotes,
    handleFinishWorkout
  };
};

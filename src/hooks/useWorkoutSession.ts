import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Workout, Exercise } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { updateProfile } from "@/contexts/profile";

interface UseWorkoutSessionProps {
  workoutId?: string;
}

export const useWorkoutSession = ({ workoutId }: UseWorkoutSessionProps = {}) => {
  const { user, setUser } = useAuth();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");
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
          const formattedWorkout: Workout = {
            id: workoutData.id,
            name: workoutData.name,
            exercises: workoutData.exercises || [],
            createdAt: workoutData.created_at,
            updatedAt: workoutData.updated_at
          };

          setWorkout(formattedWorkout);
          setExercises(formattedWorkout.exercises);
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

  const updateExercise = (id: string, updates: Partial<Exercise>) => {
    setExercises(prevExercises =>
      prevExercises.map(ex => (ex.id === id ? { ...ex, ...updates } : ex))
    );
  };

  const completeWorkout = async () => {
    if (!user?.id || !workout) return;
    
    try {
      // Calculate XP: 25 XP per completed exercise
      const completedExercises = exercises.filter(ex => ex.completed).length;
      const xpEarned = completedExercises * 25;
      
      // Create workout session
      const { error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          workout_id: workout.id,
          completed: true,
          xp_earned: xpEarned,
          notes: notes
        });

      if (sessionError) throw sessionError;

      // Update user's XP
      await updateProfile(user, setUser, {
        xp: (user.xp || 0) + xpEarned
      });

      toast({
        title: "Treino concluído!",
        description: `Você ganhou ${xpEarned} XP!`,
      });

      navigate('/workouts');
    } catch (error) {
      console.error('Error completing workout:', error);
      toast({
        title: "Erro ao concluir treino",
        description: "Não foi possível salvar o treino.",
        variant: "destructive",
      });
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
    setNotes
  };
};

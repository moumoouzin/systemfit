import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ExerciseStatus, Exercise, Workout, User } from "@/types";
import { v4 as uuidv4 } from 'uuid';

export const useWorkoutSession = (workout: Workout | null, user: User | null) => {
  const [exerciseStatus, setExerciseStatus] = useState<ExerciseStatus[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initializeExerciseStatus = (exercises: Exercise[]) => {
    if (!user?.id) return;
    
    const savedWeightsStr = localStorage.getItem(`exerciseWeights_${user.id}`);
    const savedWeights = savedWeightsStr ? JSON.parse(savedWeightsStr) : {};
    
    const status = exercises.map(exercise => {
      const prevWeight = savedWeights[exercise.id] || 0;
      return {
        id: exercise.id,
        completed: false,
        weight: 0,
        previousWeight: prevWeight > 0 ? prevWeight : undefined
      };
    });
    
    setExerciseStatus(status);
  };

  const toggleExerciseCompletion = (exerciseId: string) => {
    setExerciseStatus(prev => 
      prev.map(status => 
        status.id === exerciseId 
          ? { ...status, completed: !status.completed } 
          : status
      )
    );
  };

  const updateWeight = (exerciseId: string, weight: number) => {
    setExerciseStatus(prev => 
      prev.map(status => 
        status.id === exerciseId 
          ? { ...status, weight } 
          : status
      )
    );
  };

  const handleFinishWorkout = async (updateProfileFn: (data: Partial<User>) => Promise<void>) => {
    if (!workout || !user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para salvar este treino.",
        variant: "destructive",
      });
      return { success: false };
    }

    setIsSubmitting(true);
    
    try {
      const completedExercises = exerciseStatus.filter(status => status.completed);
      const xpEarned = completedExercises.length * 5;
      
      const weightsToSave: Record<string, number> = {};
      exerciseStatus.forEach(status => {
        if (status.completed && status.weight > 0) {
          weightsToSave[status.id] = status.weight;
        }
      });

      let workoutId = workout.id;
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workout.id);
      
      if (!isValidUUID) {
        workoutId = uuidv4();
        
        const { data: workoutData, error: workoutError } = await supabase
          .from('workouts')
          .insert({
            id: workoutId,
            name: workout.name,
            user_id: user.id
          })
          .select()
          .single();
        
        if (workoutError) {
          console.error("Error creating workout in Supabase:", workoutError);
          throw new Error("Erro ao criar treino no banco de dados");
        }
        
        const exercisesToInsert = workout.exercises.map(exercise => ({
          id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(exercise.id) 
            ? exercise.id 
            : uuidv4(),
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          workout_id: workoutId
        }));
        
        if (exercisesToInsert.length > 0) {
          const { error: exercisesError } = await supabase
            .from('exercises')
            .insert(exercisesToInsert);
          
          if (exercisesError) {
            console.error("Error creating exercises in Supabase:", exercisesError);
            console.log("Continuing despite exercise insert error");
          }
        }
      }

      for (const [exerciseId, weight] of Object.entries(weightsToSave)) {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(exerciseId)) {
          console.log("Skipping invalid exercise ID:", exerciseId);
          continue;
        }
        
        const { error: weightError } = await supabase
          .from('exercise_weights')
          .insert({
            exercise_id: exerciseId,
            user_id: user.id,
            weight: weight,
            is_latest: true
          });

        if (weightError) {
          console.error("Error saving exercise weight:", weightError);
          throw new Error("Erro ao salvar peso do exercício");
        }
      }
      
      const workoutSessionId = uuidv4();
      
      const sessionData = {
        id: workoutSessionId,
        user_id: user.id,
        workout_id: workoutId,
        date: new Date().toISOString(),
        completed: true,
        xp_earned: xpEarned
      };

      console.log("Saving workout session:", sessionData);
      
      const { error: sessionError } = await supabase
        .from('workout_sessions')
        .insert(sessionData);
        
      if (sessionError) {
        console.error("Error saving workout session:", sessionError);
        throw new Error("Erro ao salvar sessão de treino");
      }

      const savedWeightsStr = localStorage.getItem(`exerciseWeights_${user.id}`);
      const savedWeights = savedWeightsStr ? JSON.parse(savedWeightsStr) : {};
      const updatedWeights = { ...savedWeights, ...weightsToSave };
      localStorage.setItem(`exerciseWeights_${user.id}`, JSON.stringify(updatedWeights));

      const exerciseHistory = workout.exercises.map(exercise => {
        const status = exerciseStatus.find(s => s.id === exercise.id);
        return {
          id: exercise.id,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: status?.weight || 0,
          completed: status?.completed || false
        };
      });

      const historyItem = {
        id: workoutSessionId,
        date: new Date().toISOString(),
        workoutId: workout.id,
        workoutName: workout.name,
        completed: true,
        xpEarned,
        exercises: exerciseHistory,
        notes: notes.trim() || undefined
      };
      
      const historyStr = localStorage.getItem(`workoutHistory_${user.id}`);
      const history = historyStr ? JSON.parse(historyStr) : [];
      localStorage.setItem(`workoutHistory_${user.id}`, JSON.stringify([historyItem, ...history]));
      
      const totalXp = (user.xp || 0) + xpEarned;
      const daysTrainedThisWeek = (user.daysTrainedThisWeek || 0) + 1;
      const newLevel = Math.floor(totalXp / 100) + 1;
      const currentLevel = user.level || 1;
      
      if (newLevel > currentLevel) {
        toast({
          title: "🎉 Nível Aumentado!",
          description: `Parabéns! Você subiu para o nível ${newLevel}!`,
        });
      }
      
      await updateProfileFn({
        xp: totalXp,
        level: newLevel,
        daysTrainedThisWeek: Math.min(daysTrainedThisWeek, 7)
      });
      
      toast({
        title: "Treino finalizado",
        description: `Treino registrado! Você ganhou ${xpEarned} XP.`,
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error finishing workout:", error);
      toast({
        title: "Erro ao finalizar treino",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    exerciseStatus,
    notes,
    isSubmitting,
    setNotes,
    initializeExerciseStatus,
    toggleExerciseCompletion,
    updateWeight,
    handleFinishWorkout
  };
};

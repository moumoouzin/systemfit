import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Workout, Exercise, ExerciseStatus } from '@/types';
import { toast } from '@/components/ui/use-toast';

export interface ActiveWorkout {
  id: string;
  workoutId: string;
  workoutName: string;
  date: string;
  exercises: Exercise[];
  exerciseStatus: ExerciseStatus[];
  notes: string;
  isCompleted: boolean;
}

export const useActiveWorkout = () => {
  const { user } = useAuth();
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar treino ativo do banco de dados
  const loadActiveWorkout = async () => {
    if (!user?.id) {
      console.log('loadActiveWorkout - no user ID');
      return null;
    }
    
    try {
      console.log('loadActiveWorkout - fetching from database for user:', user.id);
      
      const { data, error } = await supabase
        .from('active_workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Nenhum treino ativo encontrado
          console.log('loadActiveWorkout - no active workout found');
          return null;
        }
        console.error('loadActiveWorkout - database error:', error);
        return null;
      }
      
      if (data) {
        // Converter dados do banco para o formato da interface
        const workout: ActiveWorkout = {
          id: data.id,
          workoutId: data.workout_id,
          workoutName: data.workout_name,
          date: data.date,
          exercises: data.exercises as unknown as Exercise[],
          exerciseStatus: data.exercise_status as unknown as ExerciseStatus[],
          notes: data.notes,
          isCompleted: data.is_completed
        };
        
        console.log('loadActiveWorkout - loaded workout:', workout.workoutName);
        return workout;
      }
    } catch (error) {
      console.error('loadActiveWorkout - error:', error);
    }
    
    return null;
  };

  // Salvar treino ativo no banco de dados
  const saveActiveWorkout = async (workout: ActiveWorkout | null) => {
    if (!user?.id) {
      console.log('saveActiveWorkout - no user ID');
      return;
    }
    
    try {
      if (workout) {
        console.log('saveActiveWorkout - saving workout:', workout.workoutName);
        
        // Primeiro, remover qualquer treino ativo existente
        await supabase
          .from('active_workouts')
          .delete()
          .eq('user_id', user.id)
          .eq('is_completed', false);
        
        // Depois, inserir o novo treino
        const { data, error } = await supabase
          .from('active_workouts')
          .insert({
            user_id: user.id,
            workout_id: workout.workoutId,
            workout_name: workout.workoutName,
            date: workout.date,
            exercises: workout.exercises as any,
            exercise_status: workout.exerciseStatus as any,
            notes: workout.notes,
            is_completed: workout.isCompleted
          })
          .select()
          .single();
        
        if (error) {
          console.error('saveActiveWorkout - database error:', error);
          throw error;
        }
        
        console.log('saveActiveWorkout - workout saved successfully');
        return data;
      } else {
        // Remover treino ativo
        console.log('saveActiveWorkout - removing active workout');
        
        const { error } = await supabase
          .from('active_workouts')
          .delete()
          .eq('user_id', user.id)
          .eq('is_completed', false);
        
        if (error) {
          console.error('saveActiveWorkout - error removing workout:', error);
          throw error;
        }
        
        console.log('saveActiveWorkout - workout removed successfully');
      }
    } catch (error) {
      console.error('saveActiveWorkout - error:', error);
      throw error;
    }
  };

  // Buscar peso anterior de um exercício
  const getPreviousWeight = async (exerciseId: string): Promise<number> => {
    if (!user?.id) return 0;

    try {
      // Buscar o peso mais recente do exercício na tabela exercise_weights
      const { data, error } = await supabase
        .from('exercise_weights')
        .select('weight')
        .eq('exercise_id', exerciseId)
        .eq('user_id', user.id)
        .eq('is_latest', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching previous weight:', error);
        return 0;
      }

      return data?.weight || 0;
    } catch (error) {
      console.error('Error fetching previous weight:', error);
      return 0;
    }
  };

  // Iniciar um novo treino
  const startWorkout = async (workout: Workout) => {
    if (!user?.id) return false;

    try {
      // Verificar se já existe um treino ativo
      if (activeWorkout) {
        toast({
          title: "Treino em andamento",
          description: "Você já tem um treino ativo. Finalize-o primeiro ou continue de onde parou.",
          variant: "destructive",
        });
        return false;
      }

      // Criar status inicial dos exercícios e buscar pesos anteriores
      const exerciseStatus: ExerciseStatus[] = await Promise.all(
        workout.exercises.map(async (exercise) => {
          const previousWeight = await getPreviousWeight(exercise.id);
          return {
            id: exercise.id,
            completed: false,
            weight: 0,
            previousWeight,
          };
        })
      );

      const newActiveWorkout: ActiveWorkout = {
        id: '', // Será gerado pelo banco
        workoutId: workout.id,
        workoutName: workout.name,
        date: new Date().toISOString(),
        exercises: workout.exercises,
        exerciseStatus,
        notes: "",
        isCompleted: false,
      };

      await saveActiveWorkout(newActiveWorkout);
      
      // Recarregar o treino do banco para obter o ID gerado
      const savedWorkout = await loadActiveWorkout();
      if (savedWorkout) {
        setActiveWorkout(savedWorkout);
      }

      toast({
        title: "Treino iniciado!",
        description: `${workout.name} foi adicionado à área "Sendo feito".`,
      });

      return true;
    } catch (error) {
      console.error('Error starting workout:', error);
      toast({
        title: "Erro ao iniciar treino",
        description: "Não foi possível iniciar o treino.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Atualizar status de um exercício
  const updateExerciseStatus = async (exerciseId: string, updates: Partial<ExerciseStatus>) => {
    if (!activeWorkout) return;

    try {
      const updatedStatus = activeWorkout.exerciseStatus.map(status =>
        status.id === exerciseId ? { ...status, ...updates } : status
      );

      const updatedWorkout = {
        ...activeWorkout,
        exerciseStatus: updatedStatus,
      };

      await saveActiveWorkout(updatedWorkout);
      setActiveWorkout(updatedWorkout);
    } catch (error) {
      console.error('Error updating exercise status:', error);
    }
  };

  // Atualizar observações de um exercício
  const updateExerciseNotes = async (exerciseId: string, notes: string) => {
    if (!activeWorkout) return;

    try {
      const updatedExercises = activeWorkout.exercises.map(exercise =>
        exercise.id === exerciseId ? { ...exercise, notes } : exercise
      );

      const updatedWorkout = {
        ...activeWorkout,
        exercises: updatedExercises,
      };

      await saveActiveWorkout(updatedWorkout);
      setActiveWorkout(updatedWorkout);
    } catch (error) {
      console.error('Error updating exercise notes:', error);
    }
  };

  // Atualizar notas gerais do treino
  const updateWorkoutNotes = async (notes: string) => {
    if (!activeWorkout) return;

    try {
      const updatedWorkout = {
        ...activeWorkout,
        notes,
      };

      await saveActiveWorkout(updatedWorkout);
      setActiveWorkout(updatedWorkout);
    } catch (error) {
      console.error('Error updating workout notes:', error);
    }
  };

  // Finalizar treino
  const completeWorkout = async () => {
    if (!activeWorkout || !user?.id) return false;

    try {
      // Calcular XP: 25 XP por exercício completado
      const completedExercises = activeWorkout.exerciseStatus.filter(ex => ex.completed).length;
      const xpEarned = completedExercises * 25;

      // Preparar dados dos exercícios
      const exerciseDetails = activeWorkout.exercises.map(exercise => {
        const status = activeWorkout.exerciseStatus.find(s => s.id === exercise.id);
        return {
          id: exercise.id,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: status?.weight || 0,
          completed: status?.completed || false,
          notes: exercise.notes || "",
        };
      });

      // Salvar sessão no banco
      const sessionData = {
        user_id: user.id,
        workout_id: activeWorkout.workoutId,
        completed: true,
        xp_earned: xpEarned,
        notes: activeWorkout.notes,
        exercises: exerciseDetails,
      };

      const { error: sessionError } = await supabase
        .from('workout_sessions')
        .insert(sessionData);

      if (sessionError) {
        throw sessionError;
      }

      // Atualizar XP do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ xp: (user.xp || 0) + xpEarned })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating user XP:', profileError);
      }

      // Salvar pesos dos exercícios
      const completedExerciseStatuses = activeWorkout.exerciseStatus.filter(status => status.completed);
      for (const status of completedExerciseStatuses) {
        if (status.weight > 0) {
          try {
            // Marcar todos os pesos existentes como não mais recentes
            await supabase
              .from('exercise_weights')
              .update({ is_latest: false })
              .eq('exercise_id', status.id)
              .eq('user_id', user.id);

            // Inserir novo peso como mais recente
            await supabase
              .from('exercise_weights')
              .insert({
                exercise_id: status.id,
                user_id: user.id,
                weight: status.weight,
                is_latest: true,
              });
          } catch (weightError) {
            console.error('Error updating exercise weight:', weightError);
          }
        }
      }

      // Marcar treino ativo como concluído
      await supabase
        .from('active_workouts')
        .update({ is_completed: true })
        .eq('id', activeWorkout.id);

      // Limpar treino ativo
      setActiveWorkout(null);

      toast({
        title: "Treino concluído!",
        description: `Você ganhou ${xpEarned} XP!`,
      });

      return true;
    } catch (error) {
      console.error('Error completing workout:', error);
      toast({
        title: "Erro ao concluir treino",
        description: "Não foi possível salvar o treino.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Pausar treino (manter ativo mas marcar como pausado)
  const pauseWorkout = () => {
    if (!activeWorkout) return;

    toast({
      title: "Treino pausado",
      description: "Seu progresso foi salvo. Você pode continuar a qualquer momento.",
    });
  };

  // Cancelar treino (remover sem salvar no histórico)
  const cancelWorkout = async () => {
    if (!activeWorkout || !user?.id) return;

    try {
      // Remover treino ativo do banco
      const { error } = await supabase
        .from('active_workouts')
        .delete()
        .eq('id', activeWorkout.id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Limpar treino ativo do estado
      setActiveWorkout(null);

      console.log('Workout canceled successfully');
    } catch (error) {
      console.error('Error canceling workout:', error);
      throw error;
    }
  };

  // Carregar treino ativo na inicialização
  useEffect(() => {
    const loadWorkout = async () => {
      if (user?.id) {
        const saved = await loadActiveWorkout();
        setActiveWorkout(saved);
      } else {
        setActiveWorkout(null);
      }
      setIsLoading(false);
    };

    loadWorkout();
  }, [user?.id]);

  return {
    activeWorkout,
    isLoading,
    startWorkout,
    updateExerciseStatus,
    updateExerciseNotes,
    updateWorkoutNotes,
    completeWorkout,
    pauseWorkout,
    cancelWorkout,
  };
}; 
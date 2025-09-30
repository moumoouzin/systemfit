import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Workout, Exercise, ExerciseStatus, SetStatus, ExerciseNotes } from '@/types';
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
  const [forceUpdate, setForceUpdate] = useState(0);

  // Log de mudanças de estado
  useEffect(() => {
    console.log('🔄 useActiveWorkout - state changed:', {
      hasActiveWorkout: !!activeWorkout,
      activeWorkoutId: activeWorkout?.id,
      activeWorkoutName: activeWorkout?.workoutName,
      isLoading,
      forceUpdate,
      timestamp: new Date().toISOString()
    });
  }, [activeWorkout, isLoading, forceUpdate]);

  // Carregar treino ativo do banco de dados
  const loadActiveWorkout = async () => {
    if (!user?.id) {
      console.log('loadActiveWorkout - no user ID');
      return null;
    }
    
    try {
      console.log('loadActiveWorkout - fetching from database for user:', user.id);
      
      // Verificar se o usuário está autenticado
      const { data: { session } } = await supabase.auth.getSession();
      console.log('loadActiveWorkout - current session:', session ? 'authenticated' : 'not authenticated');
      
      const { data, error } = await supabase
        .from('active_workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .maybeSingle();
      
      if (error) {
        console.error('loadActiveWorkout - database error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        if (error.code === 'PGRST116') {
          // Nenhum treino ativo encontrado
          console.log('loadActiveWorkout - no active workout found');
          return null;
        }
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
        .maybeSingle();

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
    console.log('🚀 startWorkout - FUNCTION CALLED');
    console.log('📊 startWorkout - input:', {
      workoutId: workout.id,
      workoutName: workout.name,
      hasUser: !!user?.id,
      userId: user?.id,
      hasActiveWorkout: !!activeWorkout
    });

    if (!user?.id) {
      console.log('❌ startWorkout - no user ID, returning false');
      return false;
    }

    try {
      console.log('🔄 startWorkout - checking for existing active workout in state...');
      // Verificar se já existe um treino ativo (tanto no estado quanto no banco)
      if (activeWorkout) {
        console.log('❌ startWorkout - active workout exists in state, showing toast');
        toast({
          title: "Treino em andamento",
          description: "Você já tem um treino ativo. Finalize-o primeiro ou continue de onde parou.",
          variant: "destructive",
        });
        return false;
      }

      console.log('🔄 startWorkout - checking database for existing active workouts...');
      // Verificar no banco de dados também para garantir que não há treinos ativos
      let existingActiveWorkout = null;
      
      try {
        console.log('🔄 startWorkout - executing database query...');
        const { data, error } = await Promise.race([
          supabase
            .from('active_workouts')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_completed', false)
            .maybeSingle(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database query timeout')), 5000)
          )
        ]) as any;
        
        if (error) {
          console.error('❌ startWorkout - database query error:', error);
          throw error;
        }
        
        existingActiveWorkout = data;
        console.log('📡 startWorkout - database check result:', { existingActiveWorkout });
      } catch (error) {
        console.error('❌ startWorkout - database check failed:', error);
        console.log('🔄 startWorkout - continuing without database check...');
        // Continuar sem verificação do banco se houver erro
        existingActiveWorkout = null;
      }

      if (existingActiveWorkout) {
        console.log('❌ startWorkout - existing active workout found in database, showing toast');
        toast({
          title: "Treino em andamento",
          description: "Você já tem um treino ativo. Finalize-o primeiro ou continue de onde parou.",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ startWorkout - no existing active workouts, creating new one');
      console.log('🔄 startWorkout - creating exercise status...');
      // Criar status inicial dos exercícios e buscar pesos anteriores
      const exerciseStatus: ExerciseStatus[] = await Promise.all(
        workout.exercises.map(async (exercise) => {
          console.log(`🔄 startWorkout - processing exercise: ${exercise.name}`);
          const previousWeight = await getPreviousWeight(exercise.id);
          return {
            id: exercise.id,
            completed: false,
            sets: Array.from({ length: exercise.sets }, (_, index) => ({
              setNumber: index + 1,
              reps: 0,
              weight: 0,
              completed: false
            })),
            notes: "",
            previousWeight,
          };
        })
      );

      console.log('✅ startWorkout - exercise status created:', exerciseStatus.length, 'exercises');

      console.log('🔄 startWorkout - creating active workout object...');
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

      console.log('🔄 startWorkout - saving to database...');
      await saveActiveWorkout(newActiveWorkout);
      console.log('✅ startWorkout - saved to database successfully');
      
      console.log('🔄 startWorkout - reloading from database...');
      // Recarregar o treino do banco para obter o ID gerado
      const savedWorkout = await loadActiveWorkout();
      if (savedWorkout) {
        console.log('✅ startWorkout - loaded from database:', savedWorkout.workoutName);
        setActiveWorkout(savedWorkout);
      } else {
        console.log('❌ startWorkout - failed to load from database');
      }

      console.log('🔄 startWorkout - showing success toast...');
      toast({
        title: "Treino iniciado!",
        description: `${workout.name} foi adicionado à área "Sendo feito".`,
      });

      console.log('🎉 startWorkout - COMPLETED SUCCESSFULLY');
      return true;
    } catch (error) {
      console.error('❌ startWorkout - error details:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        workoutId: workout.id,
        workoutName: workout.name
      });
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
        const setsPerformed = (status?.sets || []).map(set => ({
          setNumber: set.setNumber,
          reps: set.reps,
          weight: set.weight,
          completed: set.completed
        }));
        
        console.log('Saving exercise:', exercise.name, 'with sets:', setsPerformed);
        
        return {
          id: exercise.id,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          setsPerformed: setsPerformed,
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
        const completedSets = status.sets.filter(set => set.completed && set.weight > 0);
        if (completedSets.length > 0) {
          try {
            // Calcular peso médio para este exercício
            const avgWeight = completedSets.reduce((sum, set) => sum + set.weight, 0) / completedSets.length;
            
            // Marcar todos os pesos existentes como não mais recentes
            await supabase
              .from('exercise_weights')
              .update({ is_latest: false })
              .eq('exercise_id', status.id)
              .eq('user_id', user.id);

            // Inserir novo peso médio como mais recente
            await supabase
              .from('exercise_weights')
              .insert({
                exercise_id: status.id,
                user_id: user.id,
                weight: avgWeight,
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
    console.log('🚀 cancelWorkout - FUNCTION CALLED');
    console.log('📊 cancelWorkout - current state:', {
      hasActiveWorkout: !!activeWorkout,
      activeWorkoutId: activeWorkout?.id,
      activeWorkoutName: activeWorkout?.workoutName,
      hasUser: !!user?.id,
      userId: user?.id
    });

    if (!activeWorkout || !user?.id) {
      console.log('❌ cancelWorkout - no active workout or user, exiting');
      return;
    }

    console.log('✅ cancelWorkout - starting cancellation for workout:', activeWorkout.workoutName);

    try {
      console.log('🔄 cancelWorkout - calling supabase delete...');
      
      // Remover treino ativo do banco com timeout
      let deleteError = null;
      
      try {
        console.log('🔄 cancelWorkout - executing delete query...');
        const { error } = await Promise.race([
          supabase
            .from('active_workouts')
            .delete()
            .eq('id', activeWorkout.id)
            .eq('user_id', user.id),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Delete query timeout')), 5000)
          )
        ]) as any;
        
        deleteError = error;
        console.log('📡 cancelWorkout - supabase response:', { error });
      } catch (error) {
        console.error('❌ cancelWorkout - delete query failed:', error);
        console.log('🔄 cancelWorkout - continuing with local state cleanup...');
        // Continuar com limpeza local mesmo se o delete falhar
        deleteError = null;
      }

      if (deleteError && deleteError.message !== 'Delete query timeout') {
        console.error('❌ cancelWorkout - database error:', deleteError);
        throw deleteError;
      }

      console.log('✅ cancelWorkout - database deletion successful');

      console.log('🔄 cancelWorkout - clearing state...');
      // Limpar treino ativo do estado
      setActiveWorkout(null);
      
      console.log('🔄 cancelWorkout - forcing UI update...');
      // Forçar atualização da interface
      setForceUpdate(prev => {
        console.log('🔄 cancelWorkout - forceUpdate changed from', prev, 'to', prev + 1);
        return prev + 1;
      });

      console.log('✅ cancelWorkout - state cleared successfully');
      console.log('🎉 cancelWorkout - COMPLETED SUCCESSFULLY');
    } catch (error) {
      console.error('❌ cancelWorkout - error details:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        activeWorkoutId: activeWorkout?.id,
        userId: user?.id
      });
      throw error;
    }
  };

  // Limpar treinos ativos órfãos (que não deveriam existir)
  const cleanupOrphanedActiveWorkouts = async () => {
    if (!user?.id) return;

    try {
      // Verificar se há treinos ativos que não deveriam existir
      const { data: activeWorkouts, error } = await supabase
        .from('active_workouts')
        .select('id, workout_id, created_at')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error checking active workouts:', error);
        return;
      }

      // Se há mais de um treino ativo, manter apenas o mais recente
      if (activeWorkouts && activeWorkouts.length > 1) {
        const toDelete = activeWorkouts.slice(1); // Manter o primeiro (mais recente)
        
        for (const workout of toDelete) {
          await supabase
            .from('active_workouts')
            .delete()
            .eq('id', workout.id);
        }
        
        console.log(`Cleaned up ${toDelete.length} orphaned active workouts`);
      }
    } catch (error) {
      console.error('Error cleaning up orphaned workouts:', error);
    }
  };

  // Carregar treino ativo na inicialização
  useEffect(() => {
    const loadWorkout = async () => {
      if (user?.id) {
        // Primeiro limpar treinos órfãos
        await cleanupOrphanedActiveWorkouts();
        
        // Depois carregar o treino ativo
        const saved = await loadActiveWorkout();
        setActiveWorkout(saved);
      } else {
        setActiveWorkout(null);
      }
      setIsLoading(false);
    };

    loadWorkout();
  }, [user?.id]);

  // Escutar eventos de refresh quando app volta do background
  useEffect(() => {
    const handleAppRefresh = async () => {
      console.log('App foreground refresh triggered - reloading active workout');
      if (user?.id) {
        try {
          // Limpar treinos órfãos primeiro
          await cleanupOrphanedActiveWorkouts();
          
          // Depois carregar o treino ativo
          const saved = await loadActiveWorkout();
          setActiveWorkout(saved);
          
          console.log('Active workout reloaded successfully');
        } catch (error) {
          console.error('Error reloading active workout:', error);
        }
      }
    };

    const handlePwaRefresh = async () => {
      console.log('PWA background refresh triggered - reloading active workout');
      if (user?.id) {
        try {
          await cleanupOrphanedActiveWorkouts();
          const saved = await loadActiveWorkout();
          setActiveWorkout(saved);
        } catch (error) {
          console.error('Error reloading active workout on PWA refresh:', error);
        }
      }
    };

    const handleStateRecovery = async (event: CustomEvent) => {
      console.log('App state recovery triggered - reloading active workout');
      if (user?.id) {
        try {
          // Pequeno delay para garantir que a sessão esteja estável
          await new Promise(resolve => setTimeout(resolve, 500));
          
          await cleanupOrphanedActiveWorkouts();
          const saved = await loadActiveWorkout();
          setActiveWorkout(saved);
          
          console.log('Active workout recovered successfully');
        } catch (error) {
          console.error('Error recovering active workout:', error);
        }
      }
    };

    // Adicionar debounce para evitar múltiplas chamadas
    let refreshTimeout: NodeJS.Timeout;
    const debouncedRefresh = () => {
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(handleAppRefresh, 300);
    };

    window.addEventListener('app-foreground-refresh', debouncedRefresh);
    window.addEventListener('pwa-background-refresh', handlePwaRefresh);
    window.addEventListener('app-state-recovery', handleStateRecovery as EventListener);

    return () => {
      clearTimeout(refreshTimeout);
      window.removeEventListener('app-foreground-refresh', debouncedRefresh);
      window.removeEventListener('pwa-background-refresh', handlePwaRefresh);
      window.removeEventListener('app-state-recovery', handleStateRecovery as EventListener);
    };
  }, [user?.id]);

  return {
    activeWorkout,
    isLoading,
    forceUpdate,
    startWorkout,
    updateExerciseStatus,
    updateExerciseNotes,
    updateWorkoutNotes,
    completeWorkout,
    pauseWorkout,
    cancelWorkout,
  };
}; 
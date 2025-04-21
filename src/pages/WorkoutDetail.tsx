import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Clock, ArrowUp, ArrowDown, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Workout, Exercise, ExerciseStatus, WorkoutHistory, WorkoutExerciseHistory } from "@/types";
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const WorkoutDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exerciseStatus, setExerciseStatus] = useState<ExerciseStatus[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const today = new Date();
  const { user, updateProfile } = useAuth();

  useEffect(() => {
    if (!id || !user?.id) return;
    
    const fetchWorkout = async () => {
      setIsLoading(true);
      try {
        const currentWorkoutStr = localStorage.getItem('currentWorkout');
        if (currentWorkoutStr) {
          try {
            const currentWorkout = JSON.parse(currentWorkoutStr);
            if (currentWorkout.id === id) {
              console.log("Found workout in localStorage:", currentWorkout);
              setWorkout(currentWorkout);
              initializeExerciseStatus(currentWorkout.exercises);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.error("Error parsing currentWorkout from localStorage:", error);
          }
        }

        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        
        if (isValidUUID) {
          console.log("Fetching workout with UUID:", id);
          const { data: workoutsData, error } = await supabase
            .from('workouts')
            .select(`
              *,
              exercises (*)
            `)
            .eq('id', id)
            .eq('user_id', user.id)
            .single();
          
          if (workoutsData && !error) {
            const formattedWorkout: Workout = {
              id: workoutsData.id,
              name: workoutsData.name,
              exercises: workoutsData.exercises || [],
              createdAt: workoutsData.created_at,
              updatedAt: workoutsData.updated_at
            };
            
            setWorkout(formattedWorkout);
            initializeExerciseStatus(formattedWorkout.exercises);
            setIsLoading(false);
            return;
          } else if (error) {
            console.error("Error fetching workout from supabase:", error);
          }
        } else {
          console.log("ID is not a valid UUID:", id);
        }
        
        const savedWorkoutsStr = localStorage.getItem(`workouts_${user.id}`);
        if (savedWorkoutsStr) {
          const savedWorkouts = JSON.parse(savedWorkoutsStr);
          const foundWorkout = savedWorkouts.find((w: Workout) => w.id === id);
          
          if (foundWorkout) {
            console.log("Found workout in localStorage workouts:", foundWorkout);
            setWorkout(foundWorkout);
            initializeExerciseStatus(foundWorkout.exercises);
          } else {
            console.error("Workout not found:", id);
            toast({
              title: "Treino não encontrado",
              description: "O treino solicitado não foi encontrado.",
              variant: "destructive",
            });
          }
        } else {
          console.error("No workouts available");
          toast({
            title: "Dados não disponíveis",
            description: "Não há dados de treino disponíveis.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching workout:", error);
        toast({
          title: "Erro ao carregar treino",
          description: "Não foi possível carregar os detalhes do treino.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorkout();
  }, [id, user]);
  
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
  
  const handleFinishWorkout = async () => {
    setIsSubmitting(true);
    
    try {
      if (!workout || !user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para salvar este treino.",
          variant: "destructive",
        });
        return;
      }

      const completedExercises = exerciseStatus.filter(status => status.completed);
      const xpEarned = completedExercises.length * 5;
      
      const weightsToSave: Record<string, number> = {};
      exerciseStatus.forEach(status => {
        if (status.completed && status.weight > 0) {
          weightsToSave[status.id] = status.weight;
        }
      });

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
      
      const workoutId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workout.id) 
        ? workout.id 
        : uuidv4();
      
      const sessionData = {
        id: workoutSessionId,
        user_id: user.id,
        workout_id: workoutId,
        date: today.toISOString(),
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
        date: today.toISOString(),
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
      
      await updateProfile({
        xp: totalXp,
        level: newLevel,
        daysTrainedThisWeek: Math.min(daysTrainedThisWeek, 7)
      });
      
      toast({
        title: "Treino finalizado",
        description: `Treino registrado! Você ganhou ${xpEarned} XP.`,
      });
      
      navigate("/history");
    } catch (error) {
      console.error("Error finishing workout:", error);
      toast({
        title: "Erro ao finalizar treino",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!workout) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Treino não encontrado</h3>
        <p className="text-muted-foreground mb-6">
          O treino que você está procurando não existe.
        </p>
        <Button onClick={() => navigate("/workouts")}>
          Voltar aos treinos
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{workout.name}</h1>
          <p className="text-muted-foreground flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {format(today, "dd/MM/yyyy")} • {workout.exercises.length} exercícios
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={() => navigate("/workouts")}
        >
          Cancelar
        </Button>
      </div>
      
      <div className="space-y-4">
        {workout.exercises.map((exercise) => {
          const status = exerciseStatus.find(s => s.id === exercise.id);
          const hasPreviousWeight = status?.previousWeight && status.previousWeight > 0;
          const weightDifference = status ? status.weight - (status.previousWeight || 0) : 0;
          
          return (
            <Card key={exercise.id} className={status?.completed ? "border-primary" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg">
                    <Checkbox 
                      id={`exercise-${exercise.id}`}
                      checked={status?.completed || false}
                      onCheckedChange={() => toggleExerciseCompletion(exercise.id)}
                      className="mr-2"
                    />
                    <label 
                      htmlFor={`exercise-${exercise.id}`}
                      className={`cursor-pointer ${status?.completed ? "line-through text-muted-foreground" : ""}`}
                    >
                      {exercise.name}
                    </label>
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {exercise.sets} séries × {exercise.reps} reps
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor={`weight-${exercise.id}`} className="text-sm font-medium">
                      Carga atual (kg)
                    </label>
                    <Input
                      id={`weight-${exercise.id}`}
                      type="number"
                      min="0"
                      value={status?.weight || 0}
                      onChange={(e) => updateWeight(exercise.id, Number(e.target.value))}
                    />
                  </div>
                  
                  {hasPreviousWeight && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Última carga</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold">{status?.previousWeight} kg</span>
                        {weightDifference > 0 && (
                          <span className="flex items-center text-rpg-vitality">
                            <ArrowUp className="h-4 w-4 mr-1" />
                            +{weightDifference}kg
                          </span>
                        )}
                        {weightDifference < 0 && (
                          <span className="flex items-center text-rpg-strength">
                            <ArrowDown className="h-4 w-4 mr-1" />
                            {weightDifference}kg
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Anotações do Treino</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Adicione suas observações sobre o treino..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>
      
      <CardFooter className="px-0 flex justify-end">
        <Button 
          onClick={handleFinishWorkout} 
          disabled={isSubmitting || exerciseStatus.every(status => !status.completed)}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <span className="animate-pulse">Finalizando...</span>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Finalizar Treino
            </>
          )}
        </Button>
      </CardFooter>
    </div>
  );
};

export default WorkoutDetail;

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Clock, ArrowUp, ArrowDown, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { mockWorkouts } from "@/data/mockData";
import { Workout, Exercise } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth/AuthContext";

interface ExerciseStatus {
  id: string;
  completed: boolean;
  weight: number;
  previousWeight?: number;
}

const WorkoutDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exerciseStatus, setExerciseStatus] = useState<ExerciseStatus[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const today = new Date();
  
  useEffect(() => {
    // Fetch the workout data
    if (!id) return;
    
    const fetchWorkoutData = async () => {
      setIsLoading(true);
      try {
        // Check if user is authenticated
        if (!profile?.id) {
          // Fallback to mock data if not authenticated
          const foundWorkout = mockWorkouts.find(w => w.id === id);
          
          if (foundWorkout) {
            setWorkout(foundWorkout);
            
            // Initialize exercise status with mock data
            const initialStatus = foundWorkout.exercises.map(exercise => ({
              id: exercise.id,
              completed: false,
              weight: 0,
              previousWeight: Math.floor(Math.random() * 20) + 10, // Mock previous weight
            }));
            
            setExerciseStatus(initialStatus);
          }
          setIsLoading(false);
          return;
        }
        
        // Try to fetch from database if authenticated
        let { data: workoutData, error: workoutError } = await supabase
          .from('workouts')
          .select('*')
          .eq('id', id)
          .single();
          
        if (workoutError || !workoutData) {
          // Fallback to mock data if not found in database
          const foundWorkout = mockWorkouts.find(w => w.id === id);
          if (foundWorkout) {
            setWorkout(foundWorkout);
            
            // Initialize exercise status from mock data
            const initialStatus = foundWorkout.exercises.map(exercise => ({
              id: exercise.id,
              completed: false,
              weight: 0,
              previousWeight: Math.floor(Math.random() * 20) + 10,
            }));
            
            setExerciseStatus(initialStatus);
          }
        } else {
          // Fetch associated exercises
          let { data: exercisesData, error: exercisesError } = await supabase
            .from('exercises')
            .select('*')
            .eq('workout_id', id);
            
          if (exercisesError || !exercisesData) {
            console.error("Error fetching exercises:", exercisesError);
            toast({
              title: "Erro ao carregar exercícios",
              description: "Não foi possível carregar os detalhes dos exercícios.",
              variant: "destructive",
            });
            return;
          }
          
          // Format workout for the app's structure
          const formattedWorkout: Workout = {
            id: workoutData.id,
            name: workoutData.name,
            exercises: exercisesData.map(exercise => ({
              id: exercise.id,
              name: exercise.name,
              sets: exercise.sets,
              reps: exercise.reps
            })),
            createdAt: workoutData.created_at,
            updatedAt: workoutData.updated_at,
          };
          
          setWorkout(formattedWorkout);
          
          // Fetch latest weights for each exercise - directly from exercise_weights table
          const exerciseStatusPromises = exercisesData.map(async (exercise) => {
            // First try to get weights from exercise_weights table
            let { data: weightData, error: weightError } = await supabase
              .from('exercise_weights')
              .select('*')
              .eq('exercise_id', exercise.id)
              .eq('user_id', profile.id)
              .eq('is_latest', true)
              .maybeSingle();
              
            if (weightError) {
              console.error(`Error fetching weight for exercise ${exercise.id}:`, weightError);
            }
            
            return {
              id: exercise.id,
              completed: false,
              weight: 0,
              previousWeight: weightData ? Number(weightData.weight) : 0
            };
          });
          
          const exerciseStatusResults = await Promise.all(exerciseStatusPromises);
          console.log("Exercise status with weights:", exerciseStatusResults);
          setExerciseStatus(exerciseStatusResults);
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
    
    fetchWorkoutData();
  }, [id, profile]);
  
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
      // Create a copy of the current exercise status to update
      const updatedStatus = [...exerciseStatus];
      
      // If authenticated, save to database
      if (profile?.id) {
        // Create workout session record
        const { data: sessionData, error: sessionError } = await supabase
          .from('workout_sessions')
          .insert({
            workout_id: id,
            user_id: profile.id,
            date: today.toISOString(),
            completed: true
          })
          .select()
          .single();
          
        if (sessionError) {
          throw new Error(`Error saving workout session: ${sessionError.message}`);
        }
        
        // Save each completed exercise weight to the database
        for (const status of updatedStatus) {
          if (status.completed && status.weight > 0) {
            // First, update any existing is_latest records to false
            const { error: updateError } = await supabase
              .from('exercise_weights')
              .update({ is_latest: false })
              .eq('exercise_id', status.id)
              .eq('user_id', profile.id)
              .eq('is_latest', true);
              
            if (updateError) {
              console.error(`Error updating previous weight records for exercise ${status.id}:`, updateError);
            }
            
            // Insert new weight record
            const { error: weightError } = await supabase
              .from('exercise_weights')
              .insert({
                exercise_id: status.id,
                user_id: profile.id,
                weight: status.weight,
                is_latest: true
              });
              
            if (weightError) {
              console.error(`Error saving weight for exercise ${status.id}:`, weightError);
            }
            
            // Update the status for UI display
            const index = updatedStatus.findIndex(s => s.id === status.id);
            if (index !== -1) {
              updatedStatus[index] = {
                ...status,
                previousWeight: status.weight
              };
            }
          }
        }
      } else {
        // Fallback to mock data behavior
        for (let i = 0; i < updatedStatus.length; i++) {
          const status = updatedStatus[i];
          if (status.completed && status.weight > 0) {
            // Update the previousWeight with the current weight for next time
            updatedStatus[i] = {
              ...status,
              previousWeight: status.weight
            };
          }
        }
      }
      
      // Log the workout data
      const workoutData = {
        workoutId: id,
        date: today,
        exercises: updatedStatus
      };
      
      console.log("Workout completed:", workoutData);
      
      // Update the state with the new previous weights
      setExerciseStatus(updatedStatus);
      
      toast({
        title: "Treino finalizado",
        description: "Seu treino foi registrado com sucesso!",
      });
      
      // Navigate back to workouts page
      navigate("/workouts");
    } catch (error) {
      console.error("Error finishing workout:", error);
      toast({
        title: "Erro ao finalizar treino",
        description: "Tente novamente mais tarde.",
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
        {workout.exercises.map((exercise, index) => {
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

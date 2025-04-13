
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Clock, Dumbbell, ArrowUp, ArrowDown, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { mockWorkouts } from "@/data/mockData";
import { Workout, Exercise } from "@/types";

interface ExerciseStatus {
  id: string;
  completed: boolean;
  weight: number;
  previousWeight?: number;
}

const WorkoutDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exerciseStatus, setExerciseStatus] = useState<ExerciseStatus[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const today = new Date();
  
  useEffect(() => {
    // Fetch the workout data
    if (!id) return;
    
    const foundWorkout = mockWorkouts.find(w => w.id === id);
    
    if (foundWorkout) {
      setWorkout(foundWorkout);
      
      // Initialize exercise status
      const initialStatus = foundWorkout.exercises.map(exercise => ({
        id: exercise.id,
        completed: false,
        weight: 0,
        previousWeight: Math.floor(Math.random() * 20) + 10, // Mock previous weight
      }));
      
      setExerciseStatus(initialStatus);
    }
    
    setIsLoading(false);
  }, [id]);
  
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
  
  const handleFinishWorkout = () => {
    setIsSubmitting(true);
    
    try {
      // Here you would save the workout session data
      console.log("Workout completed:", {
        workoutId: id,
        date: today,
        exercises: exerciseStatus
      });
      
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

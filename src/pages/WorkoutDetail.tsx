
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { ExerciseCardWithSets } from "@/components/ExerciseCardWithSets";
import { WorkoutNotes } from "@/components/WorkoutNotes";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";

const WorkoutDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const today = new Date();

  const {
    workout,
    exercises,
    isLoading,
    exerciseStatus,
    notes,
    isSubmitting,
    setNotes,
    toggleExerciseCompletion,
    updateSets,
    updateExerciseNotes,
    handleFinishWorkout
  } = useWorkoutSession({ workoutId: id });

  const onFinishWorkout = async () => {
    const result = await handleFinishWorkout();
    
    if (result?.success) {
      navigate("/history");
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
          if (!status) return null;
          
          return (
            <ExerciseCardWithSets
              key={exercise.id}
              exercise={exercise}
              status={status}
              onToggleCompletion={toggleExerciseCompletion}
              onUpdateSets={updateSets}
              onUpdateNotes={updateExerciseNotes}
            />
          );
        })}
      </div>
      
      <WorkoutNotes
        notes={notes}
        onChange={setNotes}
      />
      
      <CardFooter className="px-0 flex justify-end">
        <Button 
          onClick={onFinishWorkout} 
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


import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Workout } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ExerciseCard } from "@/components/ExerciseCard";
import { WorkoutNotes } from "@/components/WorkoutNotes";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";

const WorkoutDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, updateProfile } = useAuth();
  const today = new Date();

  const {
    exerciseStatus,
    notes,
    isSubmitting,
    setNotes,
    initializeExerciseStatus,
    toggleExerciseCompletion,
    updateWeight,
    handleFinishWorkout
  } = useWorkoutSession(workout, user);

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

  const onFinishWorkout = async () => {
    // This is where the error was occurring - we need to await the result
    // and extract needed values rather than passing updateProfile directly
    const result = await handleFinishWorkout(async (data) => {
      const updateResult = await updateProfile(data);
      // No need to return anything as updateProfile is expected to return void
    });
    
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
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              status={status}
              onToggleCompletion={toggleExerciseCompletion}
              onUpdateWeight={updateWeight}
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

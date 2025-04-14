import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dumbbell, Plus, Search, AlertCircle } from "lucide-react";
import { mockWorkouts } from "@/data/mockData";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import WorkoutCard from "@/components/WorkoutCard";
import { toast } from "@/components/ui/use-toast";
import { Workout, Exercise } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Define the database exercise type to handle the shape from Supabase
type DbExercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  workout_id: string;
  created_at: string;
  updated_at: string;
};

const Workouts = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchWorkouts = async () => {
      setIsLoading(true);
      
      try {
        if (profile?.id && typeof profile.id === 'string' && profile.id.length > 30) {
          // Fetch workouts from Supabase
          const { data: workoutsData, error: workoutsError } = await supabase
            .from('workouts')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });
            
          if (workoutsError) {
            throw new Error(`Error fetching workouts: ${workoutsError.message}`);
          }
          
          // For each workout, fetch its exercises
          const workoutsWithExercises = await Promise.all(
            workoutsData.map(async (workout) => {
              const { data: exercisesData, error: exercisesError } = await supabase
                .from('exercises')
                .select('*')
                .eq('workout_id', workout.id);
                
              if (exercisesError) {
                console.error(`Error fetching exercises for workout ${workout.id}:`, exercisesError);
                return null;
              }
              
              // Map DB exercises to app Exercise type
              const exercises: Exercise[] = exercisesData.map((dbExercise: DbExercise) => ({
                id: dbExercise.id,
                name: dbExercise.name,
                sets: dbExercise.sets,
                reps: dbExercise.reps
              }));
              
              return {
                id: workout.id,
                name: workout.name,
                exercises: exercises,
                createdAt: workout.created_at,
                updatedAt: workout.updated_at,
              };
            })
          );
          
          // Filter out any null results from failed fetches
          const validWorkouts = workoutsWithExercises.filter(
            (workout): workout is Workout => workout !== null
          );
          
          setWorkouts(validWorkouts);
        } else {
          // Use mock data if not authenticated or invalid UUID
          setWorkouts(mockWorkouts);
          console.log("Using mock data - user not authenticated with valid UUID");
        }
      } catch (error) {
        console.error("Error fetching workouts:", error);
        toast({
          title: "Erro ao carregar treinos",
          description: "Não foi possível carregar seus treinos. Usando dados offline.",
          variant: "destructive",
        });
        // Fallback to mock data
        setWorkouts(mockWorkouts);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorkouts();
  }, [profile]);
  
  // Filter workouts based on search query
  const filteredWorkouts = workouts.filter(workout => 
    workout.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleDeleteWorkout = (workoutId: string) => {
    setWorkoutToDelete(workoutId);
  };
  
  const confirmDeleteWorkout = async () => {
    if (!workoutToDelete) return;
    
    try {
      if (profile?.id && typeof profile.id === 'string' && profile.id.length > 30) {
        // Delete from database
        const { error } = await supabase
          .from('workouts')
          .delete()
          .eq('id', workoutToDelete)
          .eq('user_id', profile.id);
          
        if (error) {
          throw new Error(`Error deleting workout: ${error.message}`);
        }
      }
      
      // Update local state
      const updatedWorkouts = workouts.filter(w => w.id !== workoutToDelete);
      setWorkouts(updatedWorkouts);
      
      toast({
        title: "Treino excluído",
        description: "O treino foi excluído com sucesso.",
      });
    } catch (error) {
      console.error("Error deleting workout:", error);
      toast({
        title: "Erro ao excluir treino",
        description: "Não foi possível excluir o treino.",
        variant: "destructive",
      });
    } finally {
      setWorkoutToDelete(null);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Treinos</h1>
          <p className="text-muted-foreground">
            Gerenciar seus treinos personalizados
          </p>
        </div>
        <Button 
          onClick={() => navigate('/workouts/new')}
          className="hidden sm:flex"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Treino
        </Button>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar treinos..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredWorkouts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkouts.map((workout) => (
            <WorkoutCard 
              key={workout.id} 
              workout={workout} 
              onDelete={handleDeleteWorkout}
            />
          ))}
          <Card className="flex flex-col items-center justify-center h-full border-dashed p-6">
            <Dumbbell className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Adicione um novo treino personalizado
            </p>
            <Button 
              variant="outline"
              onClick={() => navigate('/workouts/new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Treino
            </Button>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12">
          <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum treino encontrado</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery ? 
              "Nenhum treino corresponde à sua busca." : 
              "Você ainda não criou nenhum treino."}
          </p>
          <Button onClick={() => navigate('/workouts/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Novo Treino
          </Button>
        </div>
      )}
      
      <AlertDialog open={!!workoutToDelete} onOpenChange={(open) => !open && setWorkoutToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir treino</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este treino? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteWorkout} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Workouts;

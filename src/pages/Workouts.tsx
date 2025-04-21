
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WorkoutCard from "@/components/WorkoutCard";
import { Workout } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Workouts = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const loadWorkouts = async () => {
      setIsLoading(true);
      try {
        if (!user?.id) {
          setWorkouts([]);
          setIsLoading(false);
          return;
        }
        
        // Try to fetch workouts from Supabase first
        const { data: workoutsData, error: workoutsError } = await supabase
          .from('workouts')
          .select(`
            *,
            exercises (*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (workoutsError) {
          console.error("Error fetching workouts from Supabase:", workoutsError);
          throw workoutsError;
        }
        
        if (workoutsData && workoutsData.length > 0) {
          // Transform data to match our Workout type
          const formattedWorkouts: Workout[] = workoutsData.map(workout => ({
            id: workout.id,
            name: workout.name,
            exercises: workout.exercises || [],
            createdAt: workout.created_at,
            updatedAt: workout.updated_at
          }));
          
          setWorkouts(formattedWorkouts);
          
          // Save to user-specific localStorage
          localStorage.setItem(`workouts_${user.id}`, JSON.stringify(formattedWorkouts));
        } else {
          // If no workouts in database, try to get from localStorage
          const savedWorkouts = localStorage.getItem(`workouts_${user.id}`);
          if (savedWorkouts) {
            setWorkouts(JSON.parse(savedWorkouts));
          } else {
            // Create example workouts for new users
            const currentDate = new Date().toISOString();
            const exampleWorkouts: Workout[] = [
              {
                id: "1",
                name: "Treino de Pernas",
                exercises: [
                  { id: "1-1", name: "Agachamento", sets: 4, reps: 12 },
                  { id: "1-2", name: "Leg Press", sets: 3, reps: 15 },
                  { id: "1-3", name: "Cadeira Extensora", sets: 3, reps: 12 },
                  { id: "1-4", name: "Stiff", sets: 3, reps: 12 },
                ],
                createdAt: currentDate,
                updatedAt: currentDate
              },
              {
                id: "2",
                name: "Treino de Peito e Ombro",
                exercises: [
                  { id: "2-1", name: "Supino Reto", sets: 4, reps: 10 },
                  { id: "2-2", name: "Crucifixo", sets: 3, reps: 12 },
                  { id: "2-3", name: "Desenvolvimento", sets: 3, reps: 10 },
                  { id: "2-4", name: "Elevação Lateral", sets: 3, reps: 15 },
                ],
                createdAt: currentDate,
                updatedAt: currentDate
              }
            ];
            setWorkouts(exampleWorkouts);
            localStorage.setItem(`workouts_${user.id}`, JSON.stringify(exampleWorkouts));
          }
        }
      } catch (error) {
        console.error("Error loading workouts:", error);
        toast({
          title: "Erro ao carregar treinos",
          description: "Não foi possível carregar seus treinos.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkouts();
  }, [user]);

  const handleDelete = (workoutId: string) => {
    try {
      if (!user?.id) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para excluir treinos.",
          variant: "destructive",
        });
        return;
      }
      
      const updatedWorkouts = workouts.filter((w) => w.id !== workoutId);
      setWorkouts(updatedWorkouts);
      localStorage.setItem(`workouts_${user.id}`, JSON.stringify(updatedWorkouts));
      
      // Also delete from Supabase if it exists there
      supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId)
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error("Error deleting workout from Supabase:", error);
          }
        });
      
      toast({
        title: "Treino excluído",
        description: "O treino foi excluído com sucesso.",
      });
    } catch (error) {
      console.error("Error deleting workout:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o treino.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Seus Treinos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus treinos personalizados
          </p>
        </div>
        <Button onClick={() => navigate('/workouts/new')} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Treino
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : workouts.length > 0 ? (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Você ainda não tem treinos cadastrados</p>
          <Button onClick={() => navigate('/workouts/new')} className="w-full sm:w-auto">
            Criar meu primeiro treino
          </Button>
        </div>
      )}
    </div>
  );
};

export default Workouts;

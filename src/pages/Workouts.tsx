
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WorkoutCard from "@/components/WorkoutCard";
import { Workout } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

const Workouts = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Carregando dados do localStorage para manter a funcionalidade offline
  useEffect(() => {
    const loadWorkouts = () => {
      setIsLoading(true);
      try {
        // Carregar do localStorage
        const savedWorkouts = localStorage.getItem('workouts');
        if (savedWorkouts) {
          setWorkouts(JSON.parse(savedWorkouts));
        } else {
          // Dados iniciais de exemplo se não houver nada no localStorage
          const exampleWorkouts: Workout[] = [
            {
              id: "1",
              name: "Treino de Pernas",
              exercises: [
                { id: "1-1", name: "Agachamento", sets: 4, reps: 12 },
                { id: "1-2", name: "Leg Press", sets: 3, reps: 15 },
                { id: "1-3", name: "Cadeira Extensora", sets: 3, reps: 12 },
                { id: "1-4", name: "Stiff", sets: 3, reps: 12 },
              ]
            },
            {
              id: "2",
              name: "Treino de Peito e Ombro",
              exercises: [
                { id: "2-1", name: "Supino Reto", sets: 4, reps: 10 },
                { id: "2-2", name: "Crucifixo", sets: 3, reps: 12 },
                { id: "2-3", name: "Desenvolvimento", sets: 3, reps: 10 },
                { id: "2-4", name: "Elevação Lateral", sets: 3, reps: 15 },
              ]
            }
          ];
          setWorkouts(exampleWorkouts);
          localStorage.setItem('workouts', JSON.stringify(exampleWorkouts));
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
  }, []);

  const handleDelete = (workoutId: string) => {
    try {
      const updatedWorkouts = workouts.filter((w) => w.id !== workoutId);
      setWorkouts(updatedWorkouts);
      localStorage.setItem('workouts', JSON.stringify(updatedWorkouts));
      
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seus Treinos</h1>
          <p className="text-muted-foreground">
            Gerencie seus treinos personalizados
          </p>
        </div>
        <Button onClick={() => navigate('/workouts/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Treino
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : workouts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          <Button onClick={() => navigate('/workouts/new')}>Criar meu primeiro treino</Button>
        </div>
      )}
    </div>
  );
};

export default Workouts;

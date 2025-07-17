
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WorkoutCard from "@/components/WorkoutCard";
import { ActiveWorkoutCard } from "@/components/ActiveWorkoutCard";
import { Workout } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDraftWorkout } from "@/hooks/useDraftWorkout";
import { useActiveWorkout } from "@/hooks/useActiveWorkout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { v4 as uuidv4 } from "uuid";

const Workouts = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { draft, deleteDraft, hasDraft } = useDraftWorkout();
  const { 
    activeWorkout, 
    startWorkout, 
    updateExerciseStatus, 
    updateExerciseNotes, 
    updateWorkoutNotes, 
    completeWorkout, 
    pauseWorkout,
    cancelWorkout
  } = useActiveWorkout();



  const createExampleWorkouts = () => {
    const currentDate = new Date().toISOString();
    const exampleWorkouts: Workout[] = [
      {
        id: uuidv4(),
        name: "Treino de Pernas",
        exercises: [
          { id: uuidv4(), name: "Agachamento", sets: 4, reps: "12" },
          { id: uuidv4(), name: "Leg Press", sets: 3, reps: "15" },
          { id: uuidv4(), name: "Cadeira Extensora", sets: 3, reps: "12" },
          { id: uuidv4(), name: "Stiff", sets: 3, reps: "12" },
        ],
        createdAt: currentDate,
        updatedAt: currentDate
      },
      {
        id: uuidv4(),
        name: "Treino de Peito e Ombro",
        exercises: [
          { id: uuidv4(), name: "Supino Reto", sets: 4, reps: "10" },
          { id: uuidv4(), name: "Crucifixo", sets: 3, reps: "12" },
          { id: uuidv4(), name: "Desenvolvimento", sets: 3, reps: "10" },
          { id: uuidv4(), name: "Elevação Lateral", sets: 3, reps: "15" },
        ],
        createdAt: currentDate,
        updatedAt: currentDate
      }
    ];
    setWorkouts(exampleWorkouts);
    localStorage.setItem(`workouts_${user?.id}`, JSON.stringify(exampleWorkouts));
  };

  const clearInvalidWorkouts = () => {
    if (user?.id) {
      localStorage.removeItem(`workouts_${user.id}`);
      setWorkouts([]);
      toast({
        title: "Treinos limpos",
        description: "Os treinos inválidos foram removidos. Crie seus próprios treinos!",
      });
    }
  };

  const createExampleWorkoutsOnDemand = () => {
    if (user?.id) {
      createExampleWorkouts();
      toast({
        title: "Treinos de exemplo criados",
        description: "Foram criados treinos de exemplo para você começar!",
      });
    }
  };

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
            try {
              const parsedWorkouts = JSON.parse(savedWorkouts);
              // Filter out workouts with invalid UUIDs (like "1", "2", etc.)
              const validWorkouts = parsedWorkouts.filter((workout: Workout) => {
                // Check if the ID is a valid UUID format
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                return uuidRegex.test(workout.id);
              });
              
              if (validWorkouts.length > 0) {
                setWorkouts(validWorkouts);
                localStorage.setItem(`workouts_${user.id}`, JSON.stringify(validWorkouts));
              } else {
                // Don't create example workouts automatically - let user create their own
                setWorkouts([]);
                localStorage.removeItem(`workouts_${user.id}`);
              }
            } catch (error) {
              console.error("Error parsing saved workouts:", error);
              // Don't create example workouts automatically - let user create their own
              setWorkouts([]);
              localStorage.removeItem(`workouts_${user.id}`);
            }
          } else {
            // Don't create example workouts automatically - let user create their own
            setWorkouts([]);
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

  const handleDelete = async (workoutId: string) => {
    try {
      if (!user?.id) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para excluir treinos.",
          variant: "destructive",
        });
        return;
      }
      
      // Excluir o treino (os exercícios relacionados serão excluídos automaticamente pelo CASCADE DELETE)
      const { error: workoutError } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId)
        .eq('user_id', user.id);
      
      if (workoutError) {
        console.error("Error deleting workout from Supabase:", workoutError);
        throw workoutError;
      }
      
      // Atualizar o estado local
      const updatedWorkouts = workouts.filter((w) => w.id !== workoutId);
      setWorkouts(updatedWorkouts);
      localStorage.setItem(`workouts_${user.id}`, JSON.stringify(updatedWorkouts));
      
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

  const handleContinueDraft = () => {
    navigate('/workouts/new', { state: { loadDraft: true } });
  };

  const handleDiscardDraft = () => {
    deleteDraft();
    toast({
      title: "Rascunho removido",
      description: "O rascunho de treino foi removido.",
    });
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
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Criar Treino
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-background border shadow-md">
              <DropdownMenuItem 
                onClick={() => navigate('/workouts/new')}
                className="cursor-pointer hover:bg-muted"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Treino
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/workouts/import')}
                className="cursor-pointer hover:bg-muted"
              >
                <Upload className="mr-2 h-4 w-4" />
                Importar Planilha
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {hasDraft && (
        <Alert className="border-blue-200 bg-blue-50">
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Você tem um treino em desenvolvimento. Deseja continuar a criação?
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleContinueDraft}
              >
                Continuar criação
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleDiscardDraft}
              >
                Remover rascunho
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Seção "Sendo feito" */}
      {activeWorkout && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Sendo feito</h2>
            <div className="flex-1 h-px bg-border"></div>
          </div>
          
          <ActiveWorkoutCard
            activeWorkout={activeWorkout}
            onUpdateExerciseStatus={updateExerciseStatus}
            onUpdateExerciseNotes={updateExerciseNotes}
            onUpdateWorkoutNotes={updateWorkoutNotes}
            onComplete={completeWorkout}
            onPause={pauseWorkout}
            onCancel={cancelWorkout}
          />
        </div>
      )}



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
              onStartWorkout={startWorkout}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Você ainda não tem treinos cadastrados</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => navigate('/workouts/new')} className="w-full sm:w-auto">
              Criar meu primeiro treino
            </Button>
            <Button onClick={createExampleWorkoutsOnDemand} variant="outline" className="w-full sm:w-auto">
              Criar treinos de exemplo
            </Button>
            <Button onClick={() => navigate('/workouts/import')} variant="outline" className="w-full sm:w-auto">
              <Upload className="mr-2 h-4 w-4" />
              Importar de planilha
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workouts;

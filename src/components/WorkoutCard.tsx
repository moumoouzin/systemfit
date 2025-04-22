import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Clock, Trash, Pencil } from "lucide-react";
import { Workout } from "@/types";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

interface WorkoutCardProps {
  workout: Workout;
  onDelete?: (workoutId: string) => void;
}

const WorkoutCard = ({ workout, onDelete }: WorkoutCardProps) => {
  const navigate = useNavigate();
  
  const handleStartWorkout = () => {
    console.log("Starting workout:", workout.id);
    try {
      // Armazenar o treino atual no localStorage para acesso na página de detalhes
      localStorage.setItem('currentWorkout', JSON.stringify(workout));
      
      toast({
        title: "Treino iniciado",
        description: `Você iniciou o treino: ${workout.name}`,
      });
      
      // Navigate to workout detail page with the ID
      navigate(`/workout/${workout.id}`);
    } catch (error) {
      console.error("Error starting workout:", error);
      toast({
        title: "Erro ao iniciar treino",
        description: "Não foi possível iniciar o treino.",
        variant: "destructive",
      });
    }
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(workout.id);
    }
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/workouts/edit/${workout.id}`);
  };
  
  // Calculate estimated time (3 minutes per exercise)
  const estimatedTime = workout.exercises.length * 3;
  
  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center text-lg gap-2 truncate">
              <Dumbbell className="h-5 w-5 flex-shrink-0 text-primary" />
              <span className="truncate">{workout.name}</span>
            </CardTitle>
            <CardDescription className="flex items-center text-xs">
              <Clock className="mr-1 h-3 w-3 flex-shrink-0" />
              <span>{estimatedTime} min • {workout.exercises.length} exercícios</span>
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleEdit}
              className="h-8 w-8 flex-shrink-0"
              title="Editar treino"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {onDelete && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDelete} 
                className="h-8 w-8 flex-shrink-0 text-destructive"
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-1 text-sm">
          {workout.exercises.slice(0, 3).map((exercise) => (
            <li key={exercise.id} className="text-muted-foreground truncate">
              {exercise.name}: {exercise.sets} séries × {exercise.reps} reps
            </li>
          ))}
          {workout.exercises.length > 3 && (
            <li className="text-xs text-muted-foreground">
              + {workout.exercises.length - 3} mais exercícios
            </li>
          )}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full text-sm"
          onClick={handleStartWorkout}
        >
          Iniciar Treino
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WorkoutCard;

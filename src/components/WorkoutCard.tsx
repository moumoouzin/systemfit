
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Clock, Trash, Pencil, Play, Archive, ArchiveRestore } from "lucide-react";
import { Workout } from "@/types";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface WorkoutCardProps {
  workout: Workout;
  onDelete?: (workoutId: string) => void;
  onStartWorkout?: (workout: Workout) => Promise<boolean>;
  onArchive?: (workoutId: string) => void;
  onUnarchive?: (workoutId: string) => void;
}

const WorkoutCard = ({ workout, onDelete, onStartWorkout, onArchive, onUnarchive }: WorkoutCardProps) => {
  const navigate = useNavigate();
  
  const handleStartWorkout = async () => {
    // console.log('🎯 WorkoutCard - handleStartWorkout CLICKED');
    // console.log('📊 WorkoutCard - checking onStartWorkout:', {
    //   hasOnStartWorkout: !!onStartWorkout,
    //   workoutId: workout.id,
    //   workoutName: workout.name
    // });

    if (onStartWorkout) {
      // console.log('✅ WorkoutCard - calling onStartWorkout...');
      try {
        const success = await onStartWorkout(workout);
        // console.log('📊 WorkoutCard - onStartWorkout result:', { success });
        
        if (success) {
          // console.log('✅ WorkoutCard - workout started successfully, staying on page');
          // Se o treino foi iniciado com sucesso, não navegar para a página de detalhes
          // O treino ficará na seção "Sendo feito"
          return;
        } else {
          // console.log('❌ WorkoutCard - onStartWorkout failed, falling back to navigation');
        }
      } catch (error) {
        console.error('❌ WorkoutCard - onStartWorkout error:', error);
        // console.log('🔄 WorkoutCard - falling back to navigation due to error');
      }
    } else {
      // console.log('❌ WorkoutCard - no onStartWorkout function, using fallback');
    }
    
    // Fallback: navegar para a página de detalhes se não houver onStartWorkout
    // console.log("🔄 WorkoutCard - FALLBACK: Starting workout via navigation:", workout.id);
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
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow w-full max-w-full">
      <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center text-base sm:text-lg gap-2">
              <Dumbbell className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-primary" />
              <span className="truncate break-words">{workout.name}</span>
            </CardTitle>
            <CardDescription className="flex items-center text-xs mt-1">
              <Clock className="mr-1 h-3 w-3 flex-shrink-0" />
              <span className="break-words">{estimatedTime} min • {workout.exercises.length} exercícios</span>
            </CardDescription>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleEdit}
              className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
              title="Editar treino"
            >
              <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            
            {workout.isArchived ? (
              onUnarchive && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnarchive(workout.id);
                  }}
                  className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                  title="Desarquivar treino"
                >
                  <ArchiveRestore className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              )
            ) : (
              onArchive && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive(workout.id);
                  }}
                  className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                  title="Arquivar treino"
                >
                  <Archive className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              )
            )}

            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 text-destructive"
                    title="Excluir treino"
                  >
                    <Trash className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir treino</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir o treino "{workout.name}"? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-3 sm:px-6">
        <ul className="space-y-1 text-sm">
          {workout.exercises.slice(0, 3).map((exercise) => (
            <li key={exercise.id} className="text-muted-foreground text-xs sm:text-sm break-words">
              <span className="font-medium">{exercise.name}</span>: {exercise.sets} séries × {exercise.reps} reps
            </li>
          ))}
          {workout.exercises.length > 3 && (
            <li className="text-xs text-muted-foreground">
              + {workout.exercises.length - 3} mais exercícios
            </li>
          )}
        </ul>
      </CardContent>
      <CardFooter className="px-3 sm:px-6 pb-3 sm:pb-6">
        <Button 
          className="w-full text-xs sm:text-sm py-2"
          onClick={handleStartWorkout}
        >
          <Play className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          Iniciar Treino
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WorkoutCard;

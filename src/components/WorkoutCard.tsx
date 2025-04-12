
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Clock } from "lucide-react";
import { Workout } from "@/types";
import { useNavigate } from "react-router-dom";

interface WorkoutCardProps {
  workout: Workout;
}

const WorkoutCard = ({ workout }: WorkoutCardProps) => {
  const navigate = useNavigate();
  
  const handleStartWorkout = () => {
    navigate(`/workout/${workout.id}`);
  };
  
  // Calculate estimated time (3 minutes per exercise)
  const estimatedTime = workout.exercises.length * 3;
  
  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Dumbbell className="mr-2 h-5 w-5 text-primary" />
          {workout.name}
        </CardTitle>
        <CardDescription className="flex items-center text-xs">
          <Clock className="mr-1 h-3 w-3" />
          {estimatedTime} min • {workout.exercises.length} exercícios
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-1 text-sm">
          {workout.exercises.slice(0, 3).map((exercise) => (
            <li key={exercise.id} className="text-muted-foreground">
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
        <Button className="w-full" onClick={handleStartWorkout}>
          Iniciar Treino
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WorkoutCard;

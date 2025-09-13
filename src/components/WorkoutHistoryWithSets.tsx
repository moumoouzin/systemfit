import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkoutHistory } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trophy, Calendar, Target, Weight } from "lucide-react";

interface WorkoutHistoryWithSetsProps {
  workout: WorkoutHistory;
}

export const WorkoutHistoryWithSets = ({ workout }: WorkoutHistoryWithSetsProps) => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const calculateTotalVolume = (exercise: any) => {
    if (!exercise.setsPerformed) return 0;
    return exercise.setsPerformed.reduce((total: number, set: any) => {
      return total + (set.weight * set.reps);
    }, 0);
  };

  const calculateAverageWeight = (exercise: any) => {
    if (!exercise.setsPerformed || exercise.setsPerformed.length === 0) return 0;
    const completedSets = exercise.setsPerformed.filter((set: any) => set.completed);
    if (completedSets.length === 0) return 0;
    
    const totalWeight = completedSets.reduce((sum: number, set: any) => sum + set.weight, 0);
    return totalWeight / completedSets.length;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{workout.workoutName}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={workout.completed ? "default" : "secondary"}>
              {workout.completed ? "Concluído" : "Incompleto"}
            </Badge>
            {workout.xpEarned > 0 && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                <Trophy className="h-3 w-3 mr-1" />
                +{workout.xpEarned} XP
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-2" />
          {formatDate(workout.date)}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {workout.exercises.map((exercise) => (
            <div key={exercise.id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{exercise.name}</h4>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>{exercise.sets} séries</span>
                  <span>×</span>
                  <span>{exercise.reps} reps</span>
                </div>
              </div>
              
              {exercise.setsPerformed && exercise.setsPerformed.length > 0 ? (
                <div className="space-y-2">
                  {/* Séries realizadas */}
                  <div className="grid grid-cols-1 gap-2">
                    {exercise.setsPerformed.map((set: any, index: number) => (
                      <div 
                        key={index}
                        className={`flex items-center justify-between p-2 rounded text-sm ${
                          set.completed 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-medium">Série {set.setNumber}</span>
                          <div className="flex items-center space-x-2">
                            <span>{set.reps} reps</span>
                            <span>×</span>
                            <span className="font-medium">{set.weight}kg</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {set.weight * set.reps}kg total
                          </span>
                          {set.completed && (
                            <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                              ✓
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Resumo do exercício */}
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Weight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Peso médio:</span>
                        <span className="font-medium">{calculateAverageWeight(exercise).toFixed(1)}kg</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Volume total:</span>
                        <span className="font-medium">{calculateTotalVolume(exercise).toFixed(1)}kg</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  Nenhuma série registrada
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

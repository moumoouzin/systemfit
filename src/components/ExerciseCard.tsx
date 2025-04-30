
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Exercise, ExerciseStatus } from "@/types";
import { Weight, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ExerciseCardProps {
  exercise: Exercise;
  status: ExerciseStatus;
  onToggleCompletion: (id: string) => void;
  onUpdateWeight: (id: string, weight: number) => void;
}

export const ExerciseCard = ({ 
  exercise, 
  status, 
  onToggleCompletion, 
  onUpdateWeight 
}: ExerciseCardProps) => {
  const [weight, setWeight] = useState<string>(status.weight.toString());
  
  useEffect(() => {
    if (status.weight > 0) {
      setWeight(status.weight.toString());
    }
  }, [status.weight]);

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setWeight(newValue);
    
    // Only update if it's a valid number
    if (!isNaN(Number(newValue))) {
      onUpdateWeight(exercise.id, Number(newValue));
    }
  };
  
  const renderProgressIndicator = () => {
    if (!status.previousWeight) return null;
    
    // Calculate the weight difference
    const currentWeight = Number(weight) || 0;
    const diff = currentWeight - status.previousWeight;
    
    if (diff > 0) {
      return (
        <div className="flex items-center text-rpg-vitality" title="Progresso">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span>+{diff}kg</span>
        </div>
      );
    } else if (diff < 0) {
      return (
        <div className="flex items-center text-rpg-strength" title="Regressão">
          <TrendingDown className="h-4 w-4 mr-1" />
          <span>{diff}kg</span>
        </div>
      );
    } else if (currentWeight > 0) {
      return (
        <div className="flex items-center text-muted-foreground" title="Mantido">
          <Minus className="h-4 w-4 mr-1" />
          <span>Mesmo peso</span>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <Card className={status.completed ? "border-primary" : ""}>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Checkbox 
                id={`exercise-${exercise.id}`}
                checked={status.completed}
                onCheckedChange={() => onToggleCompletion(exercise.id)}
              />
              <div>
                <label 
                  htmlFor={`exercise-${exercise.id}`}
                  className={`text-lg font-medium ${status.completed ? "line-through text-muted-foreground" : ""}`}
                >
                  {exercise.name}
                </label>
                <p className="text-sm text-muted-foreground">
                  {exercise.sets} séries × {exercise.reps} reps
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor={`weight-${exercise.id}`} className="text-sm font-medium">
                Carga atual (kg)
              </label>
              {renderProgressIndicator()}
            </div>
            
            <div className="flex items-center space-x-2">
              <Input
                id={`weight-${exercise.id}`}
                type="number"
                value={weight}
                onChange={handleWeightChange}
                placeholder="0"
                className="w-full"
                disabled={!status.completed}
              />
              <Weight className="h-5 w-5 text-muted-foreground" />
            </div>
            
            {status.previousWeight > 0 && (
              <div className="text-sm text-muted-foreground">
                Último peso: <span className="font-medium">{status.previousWeight}kg</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

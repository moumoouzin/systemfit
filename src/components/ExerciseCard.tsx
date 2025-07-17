
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Exercise, ExerciseStatus } from "@/types";
import { Weight, TrendingUp, TrendingDown, Minus, FileText } from "lucide-react";

interface ExerciseCardProps {
  exercise: Exercise;
  status: ExerciseStatus;
  onToggleCompletion: (id: string) => void;
  onUpdateWeight: (id: string, weight: number) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
}

export const ExerciseCard = ({ 
  exercise, 
  status, 
  onToggleCompletion, 
  onUpdateWeight,
  onUpdateNotes
}: ExerciseCardProps) => {
  const [weight, setWeight] = useState<string>(status.weight.toString());
  const [notes, setNotes] = useState<string>(exercise.notes || "");
  const [showNotes, setShowNotes] = useState<boolean>(!!exercise.notes);
  
  useEffect(() => {
    if (status.weight > 0) {
      setWeight(status.weight.toString());
    }
  }, [status.weight]);

  useEffect(() => {
    setNotes(exercise.notes || "");
    setShowNotes(!!exercise.notes);
  }, [exercise.notes]);

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setWeight(newValue);
    
    // Only update if it's a valid number
    if (!isNaN(Number(newValue))) {
      onUpdateWeight(exercise.id, Number(newValue));
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    if (onUpdateNotes) {
      onUpdateNotes(exercise.id, newNotes);
    }
  };
  
  const renderProgressIndicator = () => {
    if (!status.previousWeight) return null;
    
    // Calculate the weight difference
    const currentWeight = Number(weight) || 0;
    const diff = currentWeight - status.previousWeight;
    
    if (diff > 0) {
      return (
        <div className="flex items-center text-green-600" title="Progresso">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">+{diff}kg</span>
        </div>
      );
    } else if (diff < 0) {
      return (
        <div className="flex items-center text-red-600" title="Regressão">
          <TrendingDown className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">{diff}kg</span>
        </div>
      );
    } else if (currentWeight > 0) {
      return (
        <div className="flex items-center text-blue-600" title="Mantido">
          <Minus className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">Mesmo peso</span>
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
            
            <div className="flex items-center justify-between text-sm">
              {status.previousWeight > 0 ? (
                <>
                  <span className="text-muted-foreground">
                    Último peso: <span className="font-medium text-foreground">{status.previousWeight}kg</span>
                  </span>
                  {Number(weight) > 0 && (
                    <span className={`font-medium ${
                      Number(weight) > status.previousWeight ? 'text-green-600' : 
                      Number(weight) < status.previousWeight ? 'text-red-600' : 
                      'text-blue-600'
                    }`}>
                      {Number(weight) > status.previousWeight ? '+' : ''}
                      {Number(weight) - status.previousWeight}kg
                    </span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">
                  Primeira vez fazendo este exercício
                </span>
              )}
            </div>
          </div>

          {/* Seção de Observações */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Observações (opcional)
              </label>
              <button
                type="button"
                onClick={() => setShowNotes(!showNotes)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showNotes ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            
            {showNotes && (
              <Textarea
                value={notes}
                onChange={handleNotesChange}
                placeholder="Adicione observações sobre este exercício..."
                className="min-h-[80px] resize-none"
                disabled={!status.completed}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

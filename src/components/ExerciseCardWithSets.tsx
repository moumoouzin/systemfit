import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Exercise, ExerciseStatus, SetStatus, ExerciseNotes } from "@/types";
import { Weight, TrendingUp, TrendingDown, Minus, FileText, Plus, Trash2, Bell, History } from "lucide-react";

interface ExerciseCardWithSetsProps {
  exercise: Exercise;
  status: ExerciseStatus;
  onToggleCompletion: (id: string) => void;
  onUpdateSets: (id: string, sets: SetStatus[]) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
}

export const ExerciseCardWithSets = ({ 
  exercise, 
  status, 
  onToggleCompletion, 
  onUpdateSets,
  onUpdateNotes
}: ExerciseCardWithSetsProps) => {
  const [notes, setNotes] = useState<string>(status.notes || "");
  const [showNotes, setShowNotes] = useState<boolean>(!!status.notes);
  const [showPreviousNotes, setShowPreviousNotes] = useState<boolean>(false);
  
  useEffect(() => {
    setNotes(status.notes || "");
    setShowNotes(!!status.notes);
  }, [status.notes]);

  const handleSetChange = (setIndex: number, field: 'reps' | 'weight', value: string) => {
    const newSets = [...status.sets];
    if (newSets[setIndex]) {
      if (field === 'reps') {
        newSets[setIndex].reps = parseInt(value) || 0;
      } else {
        newSets[setIndex].weight = parseFloat(value) || 0;
      }
      onUpdateSets(exercise.id, newSets);
    }
  };

  const handleSetCompletion = (setIndex: number) => {
    const newSets = [...status.sets];
    if (newSets[setIndex]) {
      newSets[setIndex].completed = !newSets[setIndex].completed;
      onUpdateSets(exercise.id, newSets);
    }
  };

  const addSet = () => {
    const newSet: SetStatus = {
      setNumber: status.sets.length + 1,
      reps: 0,
      weight: 0,
      completed: false
    };
    onUpdateSets(exercise.id, [...status.sets, newSet]);
  };

  const removeSet = (setIndex: number) => {
    if (status.sets.length > 1) {
      const newSets = status.sets.filter((_, index) => index !== setIndex);
      // Renumerar as séries
      const renumberedSets = newSets.map((set, index) => ({
        ...set,
        setNumber: index + 1
      }));
      onUpdateSets(exercise.id, renumberedSets);
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    if (onUpdateNotes) {
      onUpdateNotes(exercise.id, newNotes);
    }
  };

  const hasPreviousNotes = status.previousNotes && status.previousNotes.length > 0;
  const latestPreviousNote = hasPreviousNotes ? status.previousNotes![0] : null;

  const calculateTotalWeight = () => {
    return status.sets.reduce((total, set) => total + (set.weight * set.reps), 0);
  };

  const calculateAverageWeight = () => {
    const completedSets = status.sets.filter(set => set.completed && set.reps > 0);
    if (completedSets.length === 0) return 0;
    const totalWeight = completedSets.reduce((total, set) => total + set.weight, 0);
    return totalWeight / completedSets.length;
  };

  const renderProgressIndicator = () => {
    if (!status.previousWeight) return null;
    
    const avgWeight = calculateAverageWeight();
    const diff = avgWeight - status.previousWeight;
    
    if (diff > 0) {
      return (
        <div className="flex items-center text-green-600" title="Progresso">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">+{diff.toFixed(1)}kg</span>
        </div>
      );
    } else if (diff < 0) {
      return (
        <div className="flex items-center text-red-600" title="Regressão">
          <TrendingDown className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">{diff.toFixed(1)}kg</span>
        </div>
      );
    } else if (avgWeight > 0) {
      return (
        <div className="flex items-center text-blue-600" title="Mantido">
          <Minus className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">Mesmo peso</span>
        </div>
      );
    }
    
    return null;
  };

  // Inicializar séries se não existirem
  useEffect(() => {
    if (status.sets.length === 0) {
      const initialSets: SetStatus[] = Array.from({ length: exercise.sets }, (_, index) => ({
        setNumber: index + 1,
        reps: 0,
        weight: 0,
        completed: false
      }));
      onUpdateSets(exercise.id, initialSets);
    }
  }, [exercise.sets, status.sets.length, exercise.id, onUpdateSets]);

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
          
          {/* Séries */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Séries</label>
              {renderProgressIndicator()}
            </div>
            
            <div className="space-y-2">
              {status.sets.map((set, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 border rounded-lg">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <span className="text-sm font-medium w-8">#{set.setNumber}</span>
                    
                    <div className="flex items-center space-x-1 flex-1">
                      <Input
                        type="number"
                        value={set.reps || ''}
                        onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
                        placeholder="Reps"
                        className="w-20"
                        disabled={!status.completed}
                      />
                      <span className="text-sm text-muted-foreground">×</span>
                      <Input
                        type="number"
                        value={set.weight || ''}
                        onChange={(e) => handleSetChange(index, 'weight', e.target.value)}
                        placeholder="Peso"
                        className="w-20"
                        disabled={!status.completed}
                      />
                      <span className="text-sm text-muted-foreground">kg</span>
                    </div>
                    
                    <Checkbox
                      checked={set.completed}
                      onCheckedChange={() => handleSetCompletion(index)}
                      disabled={!status.completed}
                    />
                    
                    {status.sets.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSet(index)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={addSet}
                className="w-full"
                disabled={!status.completed}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Série
              </Button>
            </div>
            
            {/* Resumo das séries */}
            {status.sets.some(set => set.completed) && (
              <div className="bg-muted/50 p-3 rounded-lg space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Peso médio:</span>
                  <span className="font-medium">{calculateAverageWeight().toFixed(1)}kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Volume total:</span>
                  <span className="font-medium">{calculateTotalWeight().toFixed(1)}kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Séries completadas:</span>
                  <span className="font-medium">
                    {status.sets.filter(set => set.completed).length}/{status.sets.length}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Seção de Observações */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Observações (opcional)
                {hasPreviousNotes && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                    <Bell className="h-3 w-3 mr-1" />
                    Último treino
                  </Badge>
                )}
              </label>
              <div className="flex items-center gap-2">
                {hasPreviousNotes && (
                  <button
                    type="button"
                    onClick={() => setShowPreviousNotes(!showPreviousNotes)}
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                  >
                    <History className="h-3 w-3" />
                    {showPreviousNotes ? "Ocultar" : "Ver anterior"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowNotes(!showNotes)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNotes ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            {/* Observações do último treino */}
            {hasPreviousNotes && showPreviousNotes && latestPreviousNote && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-blue-800">
                    Última observação ({latestPreviousNote.workoutName})
                  </span>
                  <span className="text-xs text-blue-600">
                    {new Date(latestPreviousNote.date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm text-blue-700 italic">
                  "{latestPreviousNote.notes}"
                </p>
              </div>
            )}
            
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

import { useState, useEffect, useCallback } from "react";
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
  const [localSets, setLocalSets] = useState<SetStatus[]>(status.sets);
  
  useEffect(() => {
    setNotes(status.notes || "");
    setShowNotes(!!status.notes);
  }, [status.notes]);

  useEffect(() => {
    setLocalSets(status.sets);
  }, [status.sets]);

  // Debounced function to update sets in the database
  const debouncedUpdateSets = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (sets: SetStatus[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          onUpdateSets(exercise.id, sets);
        }, 300); // 300ms delay
      };
    })(),
    [exercise.id, onUpdateSets]
  );

  const handleSetChange = (setIndex: number, field: 'reps' | 'weight', value: string) => {
    const newSets = [...localSets];
    if (newSets[setIndex]) {
      if (field === 'reps') {
        newSets[setIndex].reps = parseInt(value) || 0;
      } else {
        newSets[setIndex].weight = parseFloat(value) || 0;
      }
      // Update local state immediately for responsive UI
      setLocalSets(newSets);
      // Debounce the database update
      debouncedUpdateSets(newSets);
    }
  };

  const handleSetCompletion = (setIndex: number) => {
    const newSets = [...localSets];
    if (newSets[setIndex]) {
      newSets[setIndex].completed = !newSets[setIndex].completed;
      setLocalSets(newSets);
      onUpdateSets(exercise.id, newSets);
    }
  };

  const addSet = () => {
    const newSet: SetStatus = {
      setNumber: localSets.length + 1,
      reps: 0,
      weight: 0,
      completed: false
    };
    const newSets = [...localSets, newSet];
    setLocalSets(newSets);
    onUpdateSets(exercise.id, newSets);
  };

  const removeSet = (setIndex: number) => {
    if (localSets.length > 1) {
      const newSets = localSets.filter((_, index) => index !== setIndex);
      // Renumerar as séries
      const renumberedSets = newSets.map((set, index) => ({
        ...set,
        setNumber: index + 1
      }));
      setLocalSets(renumberedSets);
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
    if (localSets.length === 0) {
      const initialSets: SetStatus[] = Array.from({ length: exercise.sets }, (_, index) => ({
        setNumber: index + 1,
        reps: 0,
        weight: 0,
        completed: false
      }));
      setLocalSets(initialSets);
      onUpdateSets(exercise.id, initialSets);
    }
  }, [exercise.sets, localSets.length, exercise.id, onUpdateSets]);

  return (
    <Card className={status.completed ? "border-primary" : ""}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col space-y-3 sm:space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3 min-w-0 flex-1">
              <Checkbox 
                id={`exercise-${exercise.id}`}
                checked={status.completed}
                onCheckedChange={() => onToggleCompletion(exercise.id)}
                className="mt-1 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <label 
                  htmlFor={`exercise-${exercise.id}`}
                  className={`text-base sm:text-lg font-medium block break-words ${status.completed ? "line-through text-muted-foreground" : ""}`}
                >
                  {exercise.name}
                </label>
                <p className="text-sm text-muted-foreground mt-1">
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
              {localSets.map((set, index) => (
                <div key={index} className="p-2 sm:p-3 border rounded-lg bg-card">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    {/* Número da série */}
                    <div className="flex items-center">
                      <span className="text-xs font-medium text-muted-foreground min-w-[1.5rem]">#{set.setNumber}</span>
                    </div>
                    
                    {/* Inputs de reps e peso */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={set.reps || ''}
                        onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
                        placeholder="R"
                        className="w-16 sm:w-20 text-center text-sm"
                        disabled={!status.completed}
                        min="0"
                        max="999"
                      />
                      <span className="text-sm text-muted-foreground">×</span>
                      <Input
                        type="tel"
                        inputMode="decimal"
                        pattern="[0-9]*\.?[0-9]*"
                        value={set.weight || ''}
                        onChange={(e) => handleSetChange(index, 'weight', e.target.value)}
                        placeholder="P"
                        className="w-16 sm:w-20 text-center text-sm"
                        disabled={!status.completed}
                        min="0"
                        max="999"
                        step="0.5"
                      />
                      <span className="text-sm text-muted-foreground">kg</span>
                    </div>
                    
                    {/* Controles */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Checkbox
                        checked={set.completed}
                        onCheckedChange={() => handleSetCompletion(index)}
                        disabled={!status.completed}
                        className="h-4 w-4"
                      />
                      
                      {localSets.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSet(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
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
              <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <div className="flex justify-between sm:flex-col sm:items-center sm:text-center">
                    <span className="text-muted-foreground">Peso médio:</span>
                    <span className="font-medium">{calculateAverageWeight().toFixed(1)}kg</span>
                  </div>
                  <div className="flex justify-between sm:flex-col sm:items-center sm:text-center">
                    <span className="text-muted-foreground">Volume total:</span>
                    <span className="font-medium">{calculateTotalWeight().toFixed(1)}kg</span>
                  </div>
                  <div className="flex justify-between sm:flex-col sm:items-center sm:text-center">
                    <span className="text-muted-foreground">Séries completadas:</span>
                    <span className="font-medium">
                      {status.sets.filter(set => set.completed).length}/{status.sets.length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Seção de Observações */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span className="break-words">Observações (opcional)</span>
                {hasPreviousNotes && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200 flex-shrink-0">
                    <Bell className="h-3 w-3 mr-1" />
                    Último treino
                  </Badge>
                )}
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {hasPreviousNotes && (
                  <button
                    type="button"
                    onClick={() => setShowPreviousNotes(!showPreviousNotes)}
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 whitespace-nowrap"
                  >
                    <History className="h-3 w-3" />
                    {showPreviousNotes ? "Ocultar" : "Ver anterior"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowNotes(!showNotes)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                >
                  {showNotes ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            {/* Observações do último treino */}
            {hasPreviousNotes && showPreviousNotes && latestPreviousNote && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                  <span className="text-xs font-medium text-blue-800 break-words">
                    Última observação ({latestPreviousNote.workoutName})
                  </span>
                  <span className="text-xs text-blue-600 whitespace-nowrap">
                    {new Date(latestPreviousNote.date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm text-blue-700 italic break-words">
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

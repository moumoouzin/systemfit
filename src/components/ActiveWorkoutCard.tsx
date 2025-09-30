import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExerciseCardWithSets } from "@/components/ExerciseCardWithSets";
import { ActiveWorkout } from "@/hooks/useActiveWorkout";
import { Play, Pause, CheckCircle, FileText, Clock, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/components/ui/use-toast";
import { useForceUpdate } from "@/hooks/useForceUpdate";
import { useComponentTracker } from "@/hooks/useComponentTracker";

interface ActiveWorkoutCardProps {
  activeWorkout: ActiveWorkout;
  onUpdateExerciseStatus: (exerciseId: string, updates: any) => void;
  onUpdateExerciseNotes: (exerciseId: string, notes: string) => void;
  onUpdateWorkoutNotes: (notes: string) => void;
  onComplete: () => Promise<boolean>;
  onPause: () => void;
  onCancel: () => Promise<void>;
}

export const ActiveWorkoutCard = ({
  activeWorkout,
  onUpdateExerciseStatus,
  onUpdateExerciseNotes,
  onUpdateWorkoutNotes,
  onComplete,
  onPause,
  onCancel,
}: ActiveWorkoutCardProps) => {
  const componentId = useComponentTracker('ActiveWorkoutCard');
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [workoutNotes, setWorkoutNotes] = useState(activeWorkout.notes);
  const { forceUpdate } = useForceUpdate();

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const success = await onComplete();
      if (success) {
        toast({
          title: "Treino finalizado!",
          description: "Seu treino foi salvo no histórico.",
        });
      }
    } catch (error) {
      console.error("Error completing workout:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCancel = async () => {
    console.log('🎯 ActiveWorkoutCard - handleCancel CLICKED');
    console.log('📊 ActiveWorkoutCard - current state:', {
      isCanceling,
      activeWorkoutId: activeWorkout?.id,
      activeWorkoutName: activeWorkout?.workoutName
    });
    
    setIsCanceling(true);
    console.log('🔄 ActiveWorkoutCard - isCanceling set to true');
    
    try {
      console.log('🚀 ActiveWorkoutCard - calling onCancel...');
      await onCancel();
      console.log('✅ ActiveWorkoutCard - onCancel completed successfully');
      
      console.log('🔄 ActiveWorkoutCard - forcing UI update...');
      // Forçar atualização da interface
      forceUpdate();
      console.log('✅ ActiveWorkoutCard - forceUpdate called');
      
      console.log('🔄 ActiveWorkoutCard - showing success toast...');
      toast({
        title: "Treino cancelado!",
        description: "O treino foi removido sem salvar no histórico.",
      });
      console.log('✅ ActiveWorkoutCard - success toast shown');
    } catch (error) {
      console.error("❌ ActiveWorkoutCard - error canceling workout:", error);
      console.error("❌ ActiveWorkoutCard - error details:", {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar o treino.",
        variant: "destructive",
      });
    } finally {
      console.log('🔄 ActiveWorkoutCard - setting isCanceling to false');
      setIsCanceling(false);
      console.log('✅ ActiveWorkoutCard - handleCancel COMPLETED');
    }
  };

  const handleWorkoutNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setWorkoutNotes(newNotes);
    onUpdateWorkoutNotes(newNotes);
  };

  const completedExercises = activeWorkout.exerciseStatus.filter(ex => ex.completed).length;
  const totalExercises = activeWorkout.exercises.length;
  const progressPercentage = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader className="p-3 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              {activeWorkout.workoutName}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(new Date(activeWorkout.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </div>
              <div>
                {completedExercises}/{totalExercises} exercícios completados
              </div>
            </div>
          </div>
          <div className="flex gap-1 sm:gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={onPause}
              className="flex items-center gap-1 text-xs px-2 py-1 h-7"
            >
              <Pause className="h-3 w-3" />
              <span className="hidden sm:inline">Pausar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isCanceling}
              className="flex items-center gap-1 text-xs px-2 py-1 h-7 text-destructive hover:text-destructive"
            >
              <X className="h-3 w-3" />
              <span className="hidden sm:inline">{isCanceling ? "Cancelando..." : "Cancelar"}</span>
            </Button>
            <Button
              onClick={handleComplete}
              disabled={isCompleting}
              className="flex items-center gap-1 text-xs px-2 py-1 h-7"
            >
              <CheckCircle className="h-3 w-3" />
              <span className="hidden sm:inline">{isCompleting ? "Finalizando..." : "Finalizar"}</span>
            </Button>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-4">
        {/* Notas do treino */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notas do treino
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
              value={workoutNotes}
              onChange={handleWorkoutNotesChange}
              placeholder="Adicione observações sobre este treino..."
              className="min-h-[80px] resize-none"
            />
          )}
        </div>

        {/* Lista de exercícios */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">
            Exercícios ({completedExercises}/{totalExercises})
          </h4>
          
          {activeWorkout.exercises.map((exercise) => {
            const status = activeWorkout.exerciseStatus.find(s => s.id === exercise.id);
            if (!status) return null;
            
            return (
              <ExerciseCardWithSets
                key={exercise.id}
                exercise={exercise}
                status={status}
                onToggleCompletion={(id) => 
                  onUpdateExerciseStatus(id, { completed: !status.completed })
                }
                onUpdateSets={(id, sets) => 
                  onUpdateExerciseStatus(id, { sets })
                }
                onUpdateNotes={onUpdateExerciseNotes}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}; 
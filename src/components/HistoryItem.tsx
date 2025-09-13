
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { WorkoutHistory } from "@/types";
import { Calendar, CheckCircle2, Trash2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface HistoryItemProps {
  history: WorkoutHistory;
  onDelete?: (id: string) => void;
}

const HistoryItem = ({ history, onDelete }: HistoryItemProps) => {
  const { user, updateProfile } = useAuth();
  const formattedDate = format(new Date(history.date), "dd 'de' MMMM, yyyy", { locale: ptBR });
  const formattedTime = format(new Date(history.date), "HH:mm");

  const handleDelete = async () => {
    try {
      // Calculate XP to remove: 25 XP per exercise that was completed
      const xpToRemove = history.xpEarned || history.exercises.filter(ex => ex.completed).length * 25;

      // Delete the workout session
      const { error } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('id', history.id);

      if (error) throw error;

      // Update user's XP
      if (user) {
        const newXP = Math.max(0, (user.xp || 0) - xpToRemove);
        
        await updateProfile({
          xp: newXP,
          // Level will be automatically calculated in the updateProfile function
        });
      }

      onDelete?.(history.id);
      
      toast({
        title: "Treino excluído",
        description: "O treino foi excluído com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o treino.",
        variant: "destructive",
      });
    }
  };
  
  // Calculate XP for this workout: use stored xpEarned or calculate from completed exercises
  const workoutXP = history.xpEarned || (history.exercises.filter(ex => ex.completed).length * 25);
  
  return (
    <div className="p-4 border-b last:border-0">
      <Accordion type="single" collapsible>
        <AccordionItem value="details" className="border-none">
          <AccordionTrigger className="hover:no-underline p-0 [&[data-state=open]>div]:pb-4">
            <div className="flex items-center w-full">
              <div className="mr-4 flex flex-col items-center justify-center">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground mt-1">{formattedTime}</span>
              </div>
              
              <div className="flex-1">
                <h3 className="font-medium">{history.workoutName}</h3>
                <p className="text-sm text-muted-foreground">{formattedDate}</p>
              </div>
              
              <div className="flex items-center gap-4">
                {history.completed ? (
                  <div className="flex items-center text-rpg-xp">
                    <span className="font-bold mr-1">+{workoutXP} XP</span>
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">Incompleto</span>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <div 
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </div>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir treino</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir este treino? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </AccordionTrigger>
          
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                {history.exercises && history.exercises.length > 0 ? (
                  history.exercises.map(exercise => (
                    <div 
                      key={exercise.id} 
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                    >
                      <div>
                        <p className="font-medium">{exercise.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {exercise.sets} séries × {exercise.reps} reps
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={exercise.completed ? "default" : "secondary"}>
                          {exercise.weight > 0 ? `${exercise.weight}kg` : "0kg"}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Não há detalhes disponíveis para este treino.</p>
                )}
              </div>
              
              {history.notes && history.notes.trim() !== "" && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">Anotações:</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {history.notes}
                  </p>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default HistoryItem;

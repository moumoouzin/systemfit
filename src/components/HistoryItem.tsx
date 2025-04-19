
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { WorkoutHistory } from "@/types";
import { Calendar, CheckCircle2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge";

interface HistoryItemProps {
  history: WorkoutHistory;
}

const HistoryItem = ({ history }: HistoryItemProps) => {
  const formattedDate = format(new Date(history.date), "dd 'de' MMMM, yyyy", { locale: ptBR });
  const formattedTime = format(new Date(history.date), "HH:mm");
  
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
              
              <div className="flex items-center">
                {history.completed ? (
                  <div className="flex items-center text-rpg-xp">
                    <span className="font-bold mr-1">+{history.xpEarned} XP</span>
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">Incompleto</span>
                )}
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
                          {exercise.weight}kg
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Não há detalhes disponíveis para este treino.</p>
                )}
              </div>
              
              {history.notes && (
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

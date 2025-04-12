
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { WorkoutHistory } from "@/types";
import { Calendar, CheckCircle2 } from "lucide-react";

interface HistoryItemProps {
  history: WorkoutHistory;
}

const HistoryItem = ({ history }: HistoryItemProps) => {
  const formattedDate = format(new Date(history.date), "dd 'de' MMMM, yyyy", { locale: ptBR });
  const formattedTime = format(new Date(history.date), "HH:mm");
  
  return (
    <div className="flex items-center p-4 border-b last:border-0 hover:bg-muted/30 transition-colors">
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
  );
};

export default HistoryItem;

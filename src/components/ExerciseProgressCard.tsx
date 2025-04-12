
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExerciseProgress } from "@/types";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface ExerciseProgressCardProps {
  progress: ExerciseProgress;
}

const ExerciseProgressCard = ({ progress }: ExerciseProgressCardProps) => {
  const getProgressIcon = () => {
    if (progress.progress === 'increased') {
      return <ArrowUp className="h-4 w-4 text-rpg-vitality" />;
    } else if (progress.progress === 'decreased') {
      return <ArrowDown className="h-4 w-4 text-rpg-strength" />;
    } else {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  const getWeightDifference = () => {
    const diff = progress.currentWeek.weight - progress.previousWeek.weight;
    if (diff > 0) {
      return <span className="text-rpg-vitality">+{diff}kg</span>;
    } else if (diff < 0) {
      return <span className="text-rpg-strength">{diff}kg</span>;
    } else {
      return <span className="text-muted-foreground">0kg</span>;
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>{progress.exercise}</span>
          <div className="flex items-center">
            {getWeightDifference()}
            {getProgressIcon()}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Semana atual</p>
            <p className="font-medium">{progress.currentWeek.weight}kg</p>
            <p className="text-xs text-muted-foreground">{progress.currentWeek.sets} séries • {progress.currentWeek.totalReps} reps totais</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Semana anterior</p>
            <p className="font-medium">{progress.previousWeek.weight}kg</p>
            <p className="text-xs text-muted-foreground">{progress.previousWeek.sets} séries • {progress.previousWeek.totalReps} reps totais</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExerciseProgressCard;

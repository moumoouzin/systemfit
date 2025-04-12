
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Award } from "lucide-react";

interface WeeklyProgressProps {
  daysTrainedThisWeek: number;
  totalDaysGoal?: number;
}

const WeeklyProgress = ({ daysTrainedThisWeek, totalDaysGoal = 4 }: WeeklyProgressProps) => {
  const progress = (daysTrainedThisWeek / totalDaysGoal) * 100;
  const daysLeft = totalDaysGoal - daysTrainedThisWeek;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Award className="mr-2 h-5 w-5 text-rpg-gold" />
          Progresso Semanal
        </CardTitle>
        <CardDescription>
          Treine {totalDaysGoal}x por semana para ganhar bônus de XP
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Progress value={progress} className="h-2" />
          
          <div className="flex justify-between text-sm">
            <div>
              <span className="font-medium">{daysTrainedThisWeek}</span> de {totalDaysGoal} dias
            </div>
            {daysLeft > 0 ? (
              <div className="text-muted-foreground">
                Faltam <span className="font-medium">{daysLeft}</span> dias
              </div>
            ) : (
              <div className="text-rpg-gold font-medium">
                Meta semanal atingida!
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            {Array.from({ length: totalDaysGoal }).map((_, index) => (
              <div 
                key={index}
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  index < daysTrainedThisWeek
                    ? 'bg-primary text-white border-primary'
                    : 'bg-muted border-muted-foreground/30'
                }`}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyProgress;

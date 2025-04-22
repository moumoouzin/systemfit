import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DumbbellIcon, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "@/components/UserAvatar";
import WeeklyProgress from "@/components/WeeklyProgress";
import ExerciseProgressCard from "@/components/ExerciseProgressCard";
import { useExerciseProgress } from "@/lib/exerciseProgress";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { exerciseProgress, isLoading: isLoadingProgress } = useExerciseProgress();

  if (!user) return null;

  return (
    <MainLayout>
      <div className="space-y-6">
        <UserAvatar user={user} />
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Progresso Semanal</CardTitle>
              <CardDescription>
                Acompanhe sua evolução nos treinos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WeeklyProgress totalDaysGoal={4} />
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle>Novo Treino</CardTitle>
              <CardDescription>
                Crie um novo treino personalizado
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center items-center space-y-4">
              <DumbbellIcon className="h-12 w-12 text-muted-foreground animate-pulse" />
              <Button 
                className="w-full" 
                onClick={() => navigate('/workouts/new')}
              >
                Criar Treino
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {!isLoadingProgress && exerciseProgress.slice(0, 3).map((progress) => (
            <ExerciseProgressCard key={progress.exercise} progress={progress} />
          ))}
          
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Estatísticas Detalhadas</CardTitle>
                <CardDescription>
                  Veja seu progresso completo
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button onClick={() => navigate('/workouts')}>
                  Ver treinos
                </Button>
                <Button variant="outline" onClick={() => navigate('/stats')}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Estatísticas completas
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;

import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DumbbellIcon, TrendingUp, Calendar, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WeeklyProgress from "@/components/WeeklyProgress";
import UserAvatar from "@/components/UserAvatar";
import HistoryItem from "@/components/HistoryItem";
import ExerciseProgressCard from "@/components/ExerciseProgressCard";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkoutHistory } from "@/lib/workoutHistory";
import { useExerciseProgress } from "@/lib/exerciseProgress";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workoutHistory, isLoading: isLoadingHistory } = useWorkoutHistory();
  const { exerciseProgress, isLoading: isLoadingProgress } = useExerciseProgress();

  const recentWorkouts = workoutHistory
    .filter(w => w.completed)
    .slice(0, 3);

  const improvedExercises = exerciseProgress
    .filter(ex => ex.progress === 'increased')
    .slice(0, 3);

  const isLoading = isLoadingHistory || isLoadingProgress;

  if (!user) return null;

  return (
    <MainLayout>
      <div className="space-y-6">
        <UserAvatar user={user} />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-rpg-strength/10 border-rpg-strength/20">
            <CardHeader className="pb-2">
              <CardDescription>Força</CardDescription>
              <CardTitle>{user.attributes.strength}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-rpg-vitality/10 border-rpg-vitality/20">
            <CardHeader className="pb-2">
              <CardDescription>Vigor</CardDescription>
              <CardTitle>{user.attributes.vitality}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-rpg-focus/10 border-rpg-focus/20">
            <CardHeader className="pb-2">
              <CardDescription>Foco</CardDescription>
              <CardTitle>{user.attributes.focus}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-rpg-xp/10 border-rpg-xp/20">
            <CardHeader className="pb-2">
              <CardDescription>XP Total</CardDescription>
              <CardTitle>{user.xp}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Seu progresso semanal</CardTitle>
                <CardDescription>
                  Esta semana você treinou {user.daysTrainedThisWeek} de 7 dias
                </CardDescription>
              </div>
              <div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/stats')}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Estatísticas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <WeeklyProgress daysTrainedThisWeek={user.daysTrainedThisWeek} />
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
              <DumbbellIcon className="h-12 w-12 text-muted-foreground" />
              <Button 
                className="w-full" 
                onClick={() => navigate('/workouts/new')}
              >
                Criar Treino
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Histórico Recente</CardTitle>
                <CardDescription>
                  Seus últimos treinos concluídos
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/history')}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Ver tudo
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : recentWorkouts.length > 0 ? (
                <div className="divide-y">
                  {recentWorkouts.map((history) => (
                    <HistoryItem key={`${history.workoutId}-${history.date}`} history={history} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Trophy className="h-8 w-8 mx-auto mb-2 opacity-70" />
                  <p>Complete seu primeiro treino</p>
                  <p className="text-sm">Vamos começar a jornada!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Progresso nos Exercícios</CardTitle>
                <CardDescription>
                  Exercícios com melhoria de carga
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/stats')}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Ver tudo
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : improvedExercises.length > 0 ? (
                <div className="space-y-4">
                  {improvedExercises.map((progress) => (
                    <ExerciseProgressCard 
                      key={progress.exercise} 
                      progress={progress} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-70" />
                  <p>Ainda sem progressos registrados</p>
                  <p className="text-sm">Aumente as cargas para ver seu progresso!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;

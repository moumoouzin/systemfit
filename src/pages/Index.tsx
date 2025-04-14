
import MainLayout from "@/layouts/MainLayout";
import UserAvatar from "@/components/UserAvatar";
import WeeklyProgress from "@/components/WeeklyProgress";
import WorkoutCard from "@/components/WorkoutCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Dumbbell, Plus, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Workout } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useExerciseProgress } from "@/lib/exerciseProgress";

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { exerciseProgress } = useExerciseProgress();
  
  useEffect(() => {
    const fetchWorkouts = async () => {
      setIsLoading(true);
      
      try {
        if (profile?.id) {
          // Fetch workouts from Supabase
          const { data: workoutsData, error: workoutsError } = await supabase
            .from('workouts')
            .select('*')
            .eq('user_id', profile.id)
            .limit(3);
            
          if (workoutsError) {
            console.error("Error fetching workouts:", workoutsError);
            return;
          }
          
          // For each workout, fetch its exercises
          const workoutsWithExercises = await Promise.all(
            workoutsData.map(async (workout) => {
              const { data: exercisesData, error: exercisesError } = await supabase
                .from('exercises')
                .select('*')
                .eq('workout_id', workout.id);
                
              if (exercisesError) {
                console.error(`Error fetching exercises for workout ${workout.id}:`, exercisesError);
                return null;
              }
              
              // Map DB exercises to app Exercise type
              const exercises = exercisesData.map((dbExercise) => ({
                id: dbExercise.id,
                name: dbExercise.name,
                sets: dbExercise.sets,
                reps: dbExercise.reps
              }));
              
              return {
                id: workout.id,
                name: workout.name,
                exercises: exercises,
                createdAt: workout.created_at,
                updatedAt: workout.updated_at,
              };
            })
          );
          
          // Filter out any null results from failed fetches
          const validWorkouts = workoutsWithExercises.filter(
            (workout): workout is Workout => workout !== null
          );
          
          setWorkouts(validWorkouts);
        }
      } catch (error) {
        console.error("Error fetching workouts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorkouts();
  }, [profile]);
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Olá, {profile?.name || 'Atleta'}! Vamos treinar hoje?
          </p>
        </div>
        
        {profile && <UserAvatar user={profile} />}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WeeklyProgress 
            daysTrainedThisWeek={profile?.daysTrainedThisWeek || 0} 
            totalDaysGoal={4} 
          />
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Trophy className="mr-2 h-5 w-5 text-rpg-gold" />
                Próximo Objetivo
              </CardTitle>
              <CardDescription>
                Complete para receber recompensas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="font-medium">
                  Treine 4 dias nesta semana
                </p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <div className="font-medium text-rpg-xp">+100 XP</div>
                  <span className="mx-2">•</span>
                  <div className="font-medium">+1 Ponto de Atributo</div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/workouts')}
                >
                  Ver Treinos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Seus Treinos</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/workouts')}
            >
              Ver Todos
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : workouts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {workouts.map((workout) => (
                <WorkoutCard key={workout.id} workout={workout} />
              ))}
              <Card className="flex flex-col items-center justify-center h-full border-dashed p-6">
                <Dumbbell className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  Adicione um novo treino personalizado
                </p>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/workouts/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Treino
                </Button>
              </Card>
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center p-6">
              <Dumbbell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Você ainda não criou nenhum treino
              </p>
              <Button 
                variant="outline"
                onClick={() => navigate('/workouts/new')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Treino
              </Button>
            </Card>
          )}
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Progresso Recente</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/stats')}
            >
              Ver Estatísticas
            </Button>
          </div>
          
          {exerciseProgress.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exerciseProgress.slice(0, 3).map((progress, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{progress.exercise}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-2xl font-bold">{progress.currentWeek.weight}kg</p>
                        <p className="text-xs text-muted-foreground">Carga atual</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-medium text-rpg-vitality">
                          +{progress.currentWeek.weight - progress.previousWeek.weight}kg
                        </p>
                        <p className="text-xs text-muted-foreground">vs semana anterior</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center p-6">
              <BarChart2 className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                Complete treinos para visualizar seu progresso
              </p>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;


import MainLayout from "@/layouts/MainLayout";
import ExerciseProgressCard from "@/components/ExerciseProgressCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockExerciseProgress, mockWorkoutHistory } from "@/data/mockData";
import { 
  BarChart, 
  Calendar, 
  Dumbbell, 
  LineChart, 
  Zap 
} from "lucide-react";
import { 
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart as RechartsBarChart,
  Bar
} from 'recharts';

const Stats = () => {
  // Create some sample data for the charts
  const weeklyXPData = [
    { name: 'Seg', xp: 25 },
    { name: 'Ter', xp: 25 },
    { name: 'Qua', xp: 0 },
    { name: 'Qui', xp: 25 },
    { name: 'Sex', xp: 25 },
    { name: 'Sáb', xp: 0 },
    { name: 'Dom', xp: 0 },
  ];
  
  const monthlyWorkoutData = [
    { name: 'Semana 1', treinos: 3 },
    { name: 'Semana 2', treinos: 4 },
    { name: 'Semana 3', treinos: 2 },
    { name: 'Semana 4', treinos: 3 },
  ];
  
  // Calculate some stats
  const totalWorkouts = mockWorkoutHistory.length;
  const totalXP = mockWorkoutHistory.reduce((sum, workout) => sum + workout.xpEarned, 0);
  const totalWeeks = 4; // Mock data
  const weeklyAverage = totalWorkouts / totalWeeks;
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estatísticas</h1>
          <p className="text-muted-foreground">
            Acompanhe seu progresso e evolução
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                Total de Treinos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalWorkouts}</div>
              <p className="text-sm text-muted-foreground">
                Média de {weeklyAverage.toFixed(1)} treinos por semana
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Zap className="h-4 w-4 mr-2 text-muted-foreground" />
                Total de XP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalXP}</div>
              <p className="text-sm text-muted-foreground">
                Acumulado desde o início
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Dumbbell className="h-4 w-4 mr-2 text-muted-foreground" />
                Exercícios Favoritos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium">Supino Reto</div>
              <p className="text-sm text-muted-foreground">
                Maior progresso de carga
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-primary" />
                XP Semanal
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={weeklyXPData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="xp" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <LineChart className="h-5 w-5 mr-2 text-primary" />
                Treinos Mensais
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={monthlyWorkoutData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="treinos" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-4">Progresso de Exercícios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockExerciseProgress.map((progress, index) => (
              <ExerciseProgressCard key={index} progress={progress} />
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Stats;

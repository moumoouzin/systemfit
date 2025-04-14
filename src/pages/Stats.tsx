
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useExerciseProgress } from "@/lib/exerciseProgress";
import { useWorkoutHistory } from "@/lib/workoutHistory";
import { format, parseISO, startOfWeek, endOfWeek, isSameWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

const Stats = () => {
  const { exerciseProgress, isLoading: isLoadingProgress } = useExerciseProgress();
  const { workoutHistory, isLoading: isLoadingHistory } = useWorkoutHistory();
  
  // Calculate workout stats
  const totalWorkouts = workoutHistory.length;
  const completedWorkouts = workoutHistory.filter(w => w.completed).length;
  const completionRate = totalWorkouts > 0 
    ? Math.round((completedWorkouts / totalWorkouts) * 100) 
    : 0;
  
  // Get current week's workouts
  const now = new Date();
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  
  const currentWeekWorkouts = workoutHistory.filter(workout => {
    const workoutDate = parseISO(workout.date);
    return isSameWeek(workoutDate, now, { weekStartsOn: 1 });
  });
  
  const currentWeekCompleted = currentWeekWorkouts.filter(w => w.completed).length;
  
  // Generate chart data
  const chartData = exerciseProgress.map(progress => ({
    name: progress.exercise,
    atual: progress.currentWeek.weight,
    anterior: progress.previousWeek.weight,
  }));
  
  // Sort progress by status
  const sortedProgress = [...exerciseProgress].sort((a, b) => {
    if (a.progress === 'increased' && b.progress !== 'increased') return -1;
    if (a.progress === 'maintained' && b.progress === 'decreased') return -1;
    if (a.progress === 'decreased' && b.progress !== 'decreased') return 1;
    return 0;
  });
  
  const isLoading = isLoadingProgress || isLoadingHistory;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Estatísticas</h1>
        <p className="text-muted-foreground">
          Acompanhe seu progresso de treinamento
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium">
                    Total de Treinos
                  </CardTitle>
                  <CardDescription>Todos os tempos</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalWorkouts}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium">
                    Taxa de Conclusão
                  </CardTitle>
                  <CardDescription>Treinos concluídos</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completionRate}%</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium">
                    Semana Atual
                  </CardTitle>
                  <CardDescription>
                    {format(currentWeekStart, "dd/MM", { locale: ptBR })} - {format(currentWeekEnd, "dd/MM", { locale: ptBR })}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentWeekCompleted} treinos</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium">
                    Evolução de Cargas
                  </CardTitle>
                  <CardDescription>Exercícios com aumento</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {exerciseProgress.filter(p => p.progress === 'increased').length}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="chart">
            <TabsList>
              <TabsTrigger value="chart">Gráfico</TabsTrigger>
              <TabsTrigger value="table">Tabela</TabsTrigger>
            </TabsList>
            <TabsContent value="chart" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Progresso de Cargas</CardTitle>
                  <CardDescription>
                    Comparação de cargas entre semanas
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartData}>
                      <XAxis 
                        dataKey="name" 
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}kg`}
                      />
                      <Tooltip />
                      <Bar 
                        dataKey="atual" 
                        name="Atual" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]} 
                      />
                      <Bar 
                        dataKey="anterior" 
                        name="Anterior" 
                        fill="hsl(var(--muted))" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="table">
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes de Progresso</CardTitle>
                  <CardDescription>
                    Evolução das cargas por exercício
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exercício</TableHead>
                        <TableHead>Anterior</TableHead>
                        <TableHead>Atual</TableHead>
                        <TableHead>Diferença</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedProgress.map((prog) => (
                        <TableRow key={prog.exercise}>
                          <TableCell className="font-medium">
                            {prog.exercise}
                          </TableCell>
                          <TableCell>{prog.previousWeek.weight}kg</TableCell>
                          <TableCell>{prog.currentWeek.weight}kg</TableCell>
                          <TableCell>
                            {(prog.currentWeek.weight - prog.previousWeek.weight).toFixed(1)}kg
                          </TableCell>
                          <TableCell>
                            <span className={
                              prog.progress === 'increased' ? 'text-rpg-vitality' :
                              prog.progress === 'decreased' ? 'text-rpg-strength' :
                              'text-muted-foreground'
                            }>
                              {prog.progress === 'increased' ? '↑ Aumento' :
                               prog.progress === 'decreased' ? '↓ Redução' : '• Mantido'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default Stats;

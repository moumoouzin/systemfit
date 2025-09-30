import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HistoryItem from "@/components/HistoryItem";
import { useWorkoutHistory } from "@/lib/workoutHistory";

const History = () => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const { workoutHistory, isLoading, error } = useWorkoutHistory();
  const [localHistory, setLocalHistory] = useState(workoutHistory);
  
  console.log('📄 History page - workoutHistory:', workoutHistory);
  console.log('📄 History page - isLoading:', isLoading);
  console.log('📄 History page - error:', error);
  
  useEffect(() => {
    setLocalHistory(workoutHistory);
  }, [workoutHistory]);

  const handleDelete = (deletedId: string) => {
    setLocalHistory(prev => prev.filter(item => item.id !== deletedId));
  };

  // Filter history based on active tab
  const filteredHistory = localHistory.filter(item => {
    if (activeTab === "all") return true;
    if (activeTab === "completed") return item.completed;
    if (activeTab === "incomplete") return !item.completed;
    return true;
  });
  
  // Group history by month
  const groupedHistory: Record<string, typeof filteredHistory> = {};
  
  filteredHistory.forEach(item => {
    const date = parseISO(item.date);
    const monthKey = format(date, "MMMM yyyy", { locale: ptBR });
    
    if (!groupedHistory[monthKey]) {
      groupedHistory[monthKey] = [];
    }
    
    groupedHistory[monthKey].push(item);
  });
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Histórico</h1>
        <p className="text-muted-foreground">
          Veja seu histórico de treinos
        </p>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="completed">Concluídos</TabsTrigger>
          <TabsTrigger value="incomplete">Incompletos</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-destructive">
                  Erro ao carregar o histórico: {error}
                </p>
              </CardContent>
            </Card>
          ) : Object.keys(groupedHistory).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedHistory).map(([month, items]) => (
                <Card key={month}>
                  <CardHeader className="pb-2">
                    <CardTitle className="capitalize text-lg">{month}</CardTitle>
                    <CardDescription>
                      {items.length} {items.length === 1 ? 'treino' : 'treinos'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {items.map(item => (
                        <HistoryItem 
                          key={`${item.workoutId}-${item.date}`} 
                          history={item} 
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Nenhum treino {activeTab === "completed" 
                    ? "concluído" 
                    : activeTab === "incomplete" 
                      ? "incompleto" 
                      : ""} encontrado.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default History;

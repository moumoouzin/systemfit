
import MainLayout from "@/layouts/MainLayout";
import HistoryItem from "@/components/HistoryItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { mockWorkoutHistory } from "@/data/mockData";
import { useState } from "react";
import { Calendar, History as HistoryIcon, FilterX } from "lucide-react";

const History = () => {
  const [filter, setFilter] = useState<string | null>(null);
  
  // Group workout history by date
  const groupedHistory = mockWorkoutHistory.reduce((acc, entry) => {
    const date = format(new Date(entry.date), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, typeof mockWorkoutHistory>);
  
  // Apply filter if needed
  const filteredHistory = filter 
    ? Object.fromEntries(
        Object.entries(groupedHistory).map(([date, entries]) => [
          date,
          entries.filter(entry => entry.workoutName.includes(filter))
        ]).filter(([_, entries]) => entries.length > 0)
      )
    : groupedHistory;
  
  const hasEntries = Object.values(filteredHistory).some(entries => entries.length > 0);
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Histórico</h1>
          <p className="text-muted-foreground">
            Histórico completo de todos os seus treinos
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant={!filter ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(null)}
            className="mr-2"
          >
            <HistoryIcon className="h-4 w-4 mr-2" />
            Todos
          </Button>
          
          {Array.from(new Set(mockWorkoutHistory.map(h => h.workoutName))).map(name => (
            <Button
              key={name}
              variant={filter === name ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(name)}
            >
              {name.replace(/Treino [A-Z] - /, '')}
            </Button>
          ))}
          
          {filter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter(null)}
            >
              <FilterX className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
        
        {hasEntries ? (
          <div className="space-y-4">
            {Object.entries(filteredHistory)
              .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
              .map(([date, entries]) => {
                if (entries.length === 0) return null;
                
                return (
                  <Card key={date}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {format(new Date(date), "EEEE, dd 'de' MMMM, yyyy", { locale: ptBR })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="max-h-[300px]">
                        {entries.map((history) => (
                          <HistoryItem key={history.date} history={history} />
                        ))}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-12">
            <HistoryIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum registro encontrado</h3>
            <p className="text-muted-foreground">
              {filter 
                ? "Nenhum treino corresponde ao filtro selecionado." 
                : "Você ainda não registrou nenhum treino."}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default History;

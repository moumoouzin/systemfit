
import MainLayout from "@/layouts/MainLayout";
import WorkoutCard from "@/components/WorkoutCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dumbbell, Plus, Search } from "lucide-react";
import { mockWorkouts } from "@/data/mockData";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const Workouts = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter workouts based on search query
  const filteredWorkouts = mockWorkouts.filter(workout => 
    workout.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Treinos</h1>
            <p className="text-muted-foreground">
              Gerenciar seus treinos personalizados
            </p>
          </div>
          <Button 
            onClick={() => navigate('/workouts/new')}
            className="hidden sm:flex"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Treino
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar treinos..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {filteredWorkouts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkouts.map((workout) => (
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
          <div className="text-center py-12">
            <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum treino encontrado</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 
                "Nenhum treino corresponde à sua busca." : 
                "Você ainda não criou nenhum treino."}
            </p>
            <Button onClick={() => navigate('/workouts/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo Treino
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Workouts;

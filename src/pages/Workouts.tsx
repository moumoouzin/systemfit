
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dumbbell, Plus, Search, AlertCircle } from "lucide-react";
import { mockWorkouts } from "@/data/mockData";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import WorkoutCard from "@/components/WorkoutCard";
import { toast } from "@/components/ui/use-toast";
import { Workout } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Workouts = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [workouts, setWorkouts] = useState<Workout[]>(mockWorkouts);
  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);
  
  // Filter workouts based on search query
  const filteredWorkouts = workouts.filter(workout => 
    workout.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleDeleteWorkout = (workoutId: string) => {
    setWorkoutToDelete(workoutId);
  };
  
  const confirmDeleteWorkout = () => {
    if (!workoutToDelete) return;
    
    try {
      // Filter out the workout to delete
      const updatedWorkouts = workouts.filter(w => w.id !== workoutToDelete);
      setWorkouts(updatedWorkouts);
      
      toast({
        title: "Treino excluído",
        description: "O treino foi excluído com sucesso.",
      });
    } catch (error) {
      console.error("Error deleting workout:", error);
      toast({
        title: "Erro ao excluir treino",
        description: "Não foi possível excluir o treino.",
        variant: "destructive",
      });
    } finally {
      setWorkoutToDelete(null);
    }
  };
  
  return (
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
            <WorkoutCard 
              key={workout.id} 
              workout={workout} 
              onDelete={handleDeleteWorkout}
            />
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
      
      <AlertDialog open={!!workoutToDelete} onOpenChange={(open) => !open && setWorkoutToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir treino</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este treino? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteWorkout} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Workouts;

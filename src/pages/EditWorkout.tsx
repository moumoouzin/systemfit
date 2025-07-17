import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Save, Weight, Info } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Workout, Exercise } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

const workoutFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(50, "Nome deve ter no máximo 50 caracteres"),
  description: z.string().optional(),
  exercises: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(2, "Nome do exercício é obrigatório"),
      sets: z.number().min(1, "Mínimo 1 série").max(20, "Máximo 20 séries"),
      reps: z.string().min(1, "Informe as repetições"),
      notes: z.string().optional(),
      lastWeight: z.number().optional(),
    })
  ).min(1, "Adicione pelo menos 1 exercício"),
});

type WorkoutFormValues = z.infer<typeof workoutFormSchema>;

interface PreviousWeight {
  exerciseName: string;
  weight: number;
}

const EditWorkout = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [previousWeights, setPreviousWeights] = useState<PreviousWeight[]>([]);
  const [isLoadingWeights, setIsLoadingWeights] = useState(false);

  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      name: "",
      description: "",
      exercises: [
        { id: uuidv4(), name: "", sets: 3, reps: "", lastWeight: undefined }
      ],
    },
  });

  // Carregar o treino existente
  useEffect(() => {
    const loadWorkout = async () => {
      if (!id || !user?.id) return;

      setIsLoading(true);
      try {
        const { data: workoutData, error: workoutError } = await supabase
          .from('workouts')
          .select(`
            *,
            exercises (*)
          `)
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (workoutError) {
          console.error("Error fetching workout:", workoutError);
          toast({
            title: "Erro ao carregar treino",
            description: "Não foi possível carregar o treino para edição.",
            variant: "destructive",
          });
          navigate("/workouts");
          return;
        }

        if (workoutData) {
          const exercises = workoutData.exercises.map((ex: any) => ({
            id: ex.id,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            notes: ex.notes || "",
            lastWeight: undefined
          }));

          form.reset({
            name: workoutData.name,
            description: "",
            exercises: exercises
          });
        }
      } catch (error) {
        console.error("Error loading workout:", error);
        toast({
          title: "Erro ao carregar treino",
          description: "Não foi possível carregar o treino para edição.",
          variant: "destructive",
        });
        navigate("/workouts");
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkout();
  }, [id, user?.id, form, navigate]);

  useEffect(() => {
    setPreviousWeights([
      { exerciseName: 'Supino', weight: 60 },
      { exerciseName: 'Agachamento', weight: 80 },
      { exerciseName: 'Levantamento terra', weight: 100 },
      { exerciseName: 'Puxada', weight: 50 },
      { exerciseName: 'Rosca', weight: 20 },
    ]);
  }, []);

  const findPreviousWeight = (exerciseName: string): number | undefined => {
    if (!exerciseName || exerciseName.trim() === '') return undefined;
    
    const match = previousWeights.find(item => 
      item.exerciseName.toLowerCase() === exerciseName.toLowerCase()
    );
    
    return match?.weight;
  };

  const addExercise = () => {
    const exercises = form.getValues().exercises || [];
    const newExercises = [
      ...exercises,
      { id: uuidv4(), name: "", sets: 3, reps: "", notes: "", lastWeight: undefined }
    ];
    
    form.setValue("exercises", newExercises, { 
      shouldDirty: true, 
      shouldTouch: true, 
      shouldValidate: true 
    });
    
    form.trigger("exercises");
  };

  const removeExercise = (index: number) => {
    const exercises = form.getValues().exercises;
    if (exercises.length > 1) {
      const updatedExercises = [...exercises];
      updatedExercises.splice(index, 1);
      form.setValue("exercises", updatedExercises);
    } else {
      toast({
        title: "Erro",
        description: "Você precisa ter pelo menos um exercício",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: WorkoutFormValues) => {
    if (!id || !user?.id) return;
    
    setIsSubmitting(true);
    
    try {
      // Atualizar o treino
      const { error: workoutError } = await supabase
        .from('workouts')
        .update({
          name: data.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (workoutError) {
        console.error("Error updating workout:", workoutError);
        throw new Error("Não foi possível atualizar o treino.");
      }

      // Deletar exercícios existentes
      const { error: deleteError } = await supabase
        .from('exercises')
        .delete()
        .eq('workout_id', id);

      if (deleteError) {
        console.error("Error deleting exercises:", deleteError);
      }

      // Inserir novos exercícios
      const exercisesToInsert = data.exercises.map(ex => ({
        id: uuidv4(),
        workout_id: id,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        notes: ex.notes || null
      }));
      
      if (exercisesToInsert.length > 0) {
        const { error: exercisesError } = await supabase
          .from('exercises')
          .insert(exercisesToInsert);
        
        if (exercisesError) {
          console.error("Error creating exercises:", exercisesError);
          throw new Error("Não foi possível atualizar os exercícios.");
        }
      }

      // Atualizar localStorage
      const existingWorkouts = JSON.parse(localStorage.getItem(`workouts_${user.id}`) || '[]');
      const updatedWorkouts = existingWorkouts.map((w: Workout) => 
        w.id === id 
          ? { ...w, name: data.name, exercises: data.exercises.map(ex => ({
              id: ex.id,
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              notes: ex.notes
            })) }
          : w
      );
      localStorage.setItem(`workouts_${user.id}`, JSON.stringify(updatedWorkouts));
      
      toast({
        title: "Treino atualizado",
        description: "Seu treino foi atualizado com sucesso!",
      });
      
      navigate("/workouts");
    } catch (error) {
      console.error("Error updating workout:", error);
      toast({
        title: "Erro ao atualizar treino",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o treino. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExerciseNameChange = (index: number, name: string) => {
    form.setValue(`exercises.${index}.name`, name);
    
    const previousWeight = findPreviousWeight(name);
    if (previousWeight) {
      form.setValue(`exercises.${index}.lastWeight`, previousWeight);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Treino</h1>
          <p className="text-muted-foreground">
            Edite seu treino personalizado
          </p>
        </div>
        <Button 
          onClick={() => navigate('/workouts')}
          variant="outline"
        >
          Cancelar
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Informações básicas</CardTitle>
              <CardDescription>
                Edite as informações gerais do seu treino
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do treino</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Treino de Pernas" {...field} />
                    </FormControl>
                    <FormDescription>
                      Um nome curto e descritivo para seu treino.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Exercícios</CardTitle>
                <CardDescription>
                  Edite os exercícios para este treino
                </CardDescription>
              </div>
              <Button 
                type="button" 
                onClick={addExercise}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Exercício
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {form.watch('exercises').map((exercise, index) => (
                  <div key={exercise.id} className="border rounded-md p-4 relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 h-6 w-6"
                      onClick={() => removeExercise(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    
                    <div className="space-y-3">
                      <div>
                        <FormLabel htmlFor={`exercises.${index}.name`}>Nome</FormLabel>
                        <Controller
                          control={form.control}
                          name={`exercises.${index}.name`}
                          render={({ field }) => (
                            <Input
                              id={`exercises.${index}.name`}
                              placeholder="ex: Agachamento"
                              {...field}
                              onChange={(e) => handleExerciseNameChange(index, e.target.value)}
                            />
                          )}
                        />
                        {form.formState.errors.exercises?.[index]?.name && (
                          <p className="text-sm text-red-500 mt-1">
                            {form.formState.errors.exercises[index]?.name?.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <FormLabel htmlFor={`exercises.${index}.sets`}>Séries</FormLabel>
                          <Controller
                            control={form.control}
                            name={`exercises.${index}.sets`}
                            render={({ field }) => (
                              <Input
                                id={`exercises.${index}.sets`}
                                type="number"
                                min={1}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            )}
                          />
                          {form.formState.errors.exercises?.[index]?.sets && (
                            <p className="text-sm text-red-500 mt-1">
                              {form.formState.errors.exercises[index]?.sets?.message}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <FormLabel htmlFor={`exercises.${index}.reps`}>Repetições</FormLabel>
                          <Controller
                            control={form.control}
                            name={`exercises.${index}.reps`}
                            render={({ field }) => (
                              <Input
                                id={`exercises.${index}.reps`}
                                type="text"
                                placeholder="ex: 10, até a falha..."
                                {...field}
                              />
                            )}
                          />
                          {form.formState.errors.exercises?.[index]?.reps && (
                            <p className="text-sm text-red-500 mt-1">
                              {form.formState.errors.exercises[index]?.reps?.message}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <FormLabel htmlFor={`exercises.${index}.notes`}>Observações (opcional)</FormLabel>
                        <Controller
                          control={form.control}
                          name={`exercises.${index}.notes`}
                          render={({ field }) => (
                            <Textarea
                              id={`exercises.${index}.notes`}
                              placeholder="Adicione observações sobre este exercício..."
                              className="resize-none min-h-[80px]"
                              {...field}
                            />
                          )}
                        />
                        {form.formState.errors.exercises?.[index]?.notes && (
                          <p className="text-sm text-red-500 mt-1">
                            {form.formState.errors.exercises[index]?.notes?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {form.formState.errors.exercises && !Array.isArray(form.formState.errors.exercises) && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.exercises.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Salvando...</span>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Atualizar Treino
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EditWorkout; 
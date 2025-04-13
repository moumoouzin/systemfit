
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Plus, X, Save } from "lucide-react";
import { mockWorkouts } from "@/data/mockData";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Workout, Exercise } from "@/types";

// Form schema
const workoutFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(50, "Nome deve ter no máximo 50 caracteres"),
  description: z.string().optional(),
  exercises: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(2, "Nome do exercício é obrigatório"),
      sets: z.number().min(1, "Mínimo 1 série").max(20, "Máximo 20 séries"),
      reps: z.number().min(1, "Mínimo 1 repetição").max(100, "Máximo 100 repetições"),
    })
  ).min(1, "Adicione pelo menos 1 exercício"),
});

type WorkoutFormValues = z.infer<typeof workoutFormSchema>;

const NewWorkout = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workoutsList, setWorkoutsList] = useState<Workout[]>(mockWorkouts);
  
  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      name: "",
      description: "",
      exercises: [
        { id: uuidv4(), name: "", sets: 3, reps: 10 }
      ],
    },
  });

  const addExercise = () => {
    const exercises = form.getValues().exercises || [];
    form.setValue("exercises", [
      ...exercises, 
      { id: uuidv4(), name: "", sets: 3, reps: 10 }
    ]);
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
    setIsSubmitting(true);
    
    try {
      console.log("Creating new workout:", data);
      
      // Ensure exercises have all required properties
      const validExercises: Exercise[] = data.exercises.map(exercise => ({
        id: exercise.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps
      }));
      
      const newWorkout: Workout = {
        id: uuidv4(),
        name: data.name,
        exercises: validExercises,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Update local state with the new workout
      const updatedWorkouts = [...workoutsList, newWorkout];
      setWorkoutsList(updatedWorkouts);
      
      // In a real app with Supabase, we would save to the database here
      // For now we update our mockWorkouts in a way that persists during the session
      mockWorkouts.push(newWorkout);
      
      toast({
        title: "Treino criado",
        description: "Seu novo treino foi criado com sucesso!",
      });
      
      navigate("/workouts");
    } catch (error) {
      console.error("Error creating workout:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o treino",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Treino</h1>
          <p className="text-muted-foreground">
            Crie um novo treino personalizado
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
                Preencha as informações gerais do seu treino
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
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição ou notas sobre este treino" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Adicione notas ou detalhes sobre este treino.
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
                  Adicione os exercícios para este treino
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
                {form.getValues().exercises.map((exercise, index) => (
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
                                type="number"
                                min={1}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
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
                  Criar Treino
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NewWorkout;

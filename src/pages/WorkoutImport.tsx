import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { Workout } from '@/types';

interface CSVRow {
  'Nome do Treino': string;
  'Descrição do Treino': string;
  'Nome do Exercício': string;
  'Séries': string;
  'Repetições': string;
  'Peso (kg)': string;
}

const WorkoutImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Gerar planilha modelo
  const generateSampleFile = () => {
    const sampleData = [
      {
        'Nome do Treino': 'Treino de Peito e Tríceps',
        'Descrição do Treino': 'Foco em desenvolvimento do peitoral e tríceps',
        'Nome do Exercício': 'Supino Reto',
        'Séries': '4',
        'Repetições': '8-10',
        'Peso (kg)': '80'
      },
      {
        'Nome do Treino': 'Treino de Peito e Tríceps',
        'Descrição do Treino': 'Foco em desenvolvimento do peitoral e tríceps',
        'Nome do Exercício': 'Supino Inclinado',
        'Séries': '3',
        'Repetições': '10-12',
        'Peso (kg)': '70'
      },
      {
        'Nome do Treino': 'Treino de Peito e Tríceps',
        'Descrição do Treino': 'Foco em desenvolvimento do peitoral e tríceps',
        'Nome do Exercício': 'Crucifixo',
        'Séries': '3',
        'Repetições': '12-15',
        'Peso (kg)': '25'
      },
      {
        'Nome do Treino': 'Treino de Peito e Tríceps',
        'Descrição do Treino': 'Foco em desenvolvimento do peitoral e tríceps',
        'Nome do Exercício': 'Tríceps Pulley',
        'Séries': '3',
        'Repetições': '12-15',
        'Peso (kg)': '35'
      },
      {
        'Nome do Treino': 'Treino de Pernas',
        'Descrição do Treino': 'Treino completo para membros inferiores',
        'Nome do Exercício': 'Agachamento',
        'Séries': '4',
        'Repetições': '10-12',
        'Peso (kg)': '100'
      },
      {
        'Nome do Treino': 'Treino de Pernas',
        'Descrição do Treino': 'Treino completo para membros inferiores',
        'Nome do Exercício': 'Leg Press',
        'Séries': '3',
        'Repetições': '15-20',
        'Peso (kg)': '200'
      },
      {
        'Nome do Treino': 'Treino de Pernas',
        'Descrição do Treino': 'Treino completo para membros inferiores',
        'Nome do Exercício': 'Cadeira Extensora',
        'Séries': '3',
        'Repetições': '12-15',
        'Peso (kg)': '45'
      },
      {
        'Nome do Treino': 'Treino de Pernas',
        'Descrição do Treino': 'Treino completo para membros inferiores',
        'Nome do Exercício': 'Mesa Flexora',
        'Séries': '3',
        'Repetições': '12-15',
        'Peso (kg)': '40'
      }
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_treinos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Planilha modelo baixada",
      description: "Use esta planilha como exemplo para importar seus treinos.",
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      previewFile(selectedFile);
    }
  };

  const previewFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreviewData(results.data.slice(0, 5)); // Mostrar apenas 5 primeiras linhas
      },
      error: (error) => {
        toast({
          title: "Erro ao ler arquivo",
          description: "Não foi possível ler o arquivo CSV.",
          variant: "destructive",
        });
        console.error(error);
      }
    });
  };

  const processWorkouts = (data: CSVRow[]): Workout[] => {
    const workoutMap = new Map<string, Workout>();

    data.forEach((row) => {
      const workoutName = row['Nome do Treino']?.trim();
      const description = row['Descrição do Treino']?.trim();
      const exerciseName = row['Nome do Exercício']?.trim();
      const sets = parseInt(row['Séries']) || 3;
      const reps = row['Repetições']?.trim() || '12';
      const weight = parseFloat(row['Peso (kg)']) || 0;

      if (!workoutName || !exerciseName) return;

      if (!workoutMap.has(workoutName)) {
        workoutMap.set(workoutName, {
          id: uuidv4(),
          name: workoutName,
          exercises: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      const workout = workoutMap.get(workoutName)!;
      workout.exercises.push({
        id: uuidv4(),
        name: exerciseName,
        sets,
        reps
      });
    });

    return Array.from(workoutMap.values());
  };

  const handleImport = async () => {
    if (!file || !user?.id) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo e certifique-se de estar logado.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data as CSVRow[];
          const workouts = processWorkouts(data);

          if (workouts.length === 0) {
            toast({
              title: "Nenhum treino encontrado",
              description: "Verifique se a planilha está no formato correto.",
              variant: "destructive",
            });
            setIsProcessing(false);
            return;
          }

          // Salvar treinos no Supabase
          for (const workout of workouts) {
            const { data: workoutData, error: workoutError } = await supabase
              .from('workouts')
              .insert({
                id: workout.id,
                user_id: user.id,
                name: workout.name,
                created_at: workout.createdAt,
                updated_at: workout.updatedAt
              })
              .select()
              .single();

            if (workoutError) {
              console.error("Erro ao criar treino:", workoutError);
              continue;
            }

            // Salvar exercícios
            if (workout.exercises.length > 0) {
              const exercisesToInsert = workout.exercises.map(ex => ({
                id: uuidv4(),
                workout_id: workout.id,
                name: ex.name,
                sets: ex.sets,
                reps: isNaN(Number(ex.reps)) ? 0 : Number(ex.reps)
              }));

              const { error: exercisesError } = await supabase
                .from('exercises')
                .insert(exercisesToInsert);

              if (exercisesError) {
                console.error("Erro ao criar exercícios:", exercisesError);
              }
            }
          }

          // Atualizar localStorage
          const existingWorkouts = JSON.parse(localStorage.getItem(`workouts_${user.id}`) || '[]');
          const updatedWorkouts = [...workouts, ...existingWorkouts];
          localStorage.setItem(`workouts_${user.id}`, JSON.stringify(updatedWorkouts));

          toast({
            title: "Treinos importados",
            description: `${workouts.length} treino(s) foram importados com sucesso!`,
          });

          navigate('/workouts');
        } catch (error) {
          console.error("Erro ao processar arquivo:", error);
          toast({
            title: "Erro na importação",
            description: "Não foi possível processar o arquivo.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      },
      error: (error) => {
        console.error("Erro ao ler arquivo:", error);
        toast({
          title: "Erro ao ler arquivo",
          description: "Não foi possível ler o arquivo CSV.",
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Importar Treinos</h1>
          <p className="text-muted-foreground">
            Importe seus treinos a partir de uma planilha CSV
          </p>
        </div>
        <Button 
          onClick={() => navigate('/workouts')}
          variant="outline"
        >
          Voltar
        </Button>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Formato obrigatório:</strong> O arquivo deve ser um CSV com as colunas: 
          "Nome do Treino", "Descrição do Treino", "Nome do Exercício", "Séries", "Repetições", "Peso (kg)"
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Baixar Modelo
            </CardTitle>
            <CardDescription>
              Baixe uma planilha modelo para preencher com seus treinos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={generateSampleFile} variant="outline" className="w-full">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Baixar Planilha Modelo
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importar Arquivo
            </CardTitle>
            <CardDescription>
              Selecione o arquivo CSV com seus treinos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            
            {file && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Arquivo selecionado: <strong>{file.name}</strong>
                </p>
                <Button 
                  onClick={handleImport} 
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <span className="animate-pulse">Processando...</span>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Importar Treinos
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prévia dos Dados</CardTitle>
            <CardDescription>
              Primeiras 5 linhas do arquivo selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {Object.keys(previewData[0] || {}).map((key) => (
                      <th key={key} className="text-left p-2 font-medium">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr key={index} className="border-b">
                      {Object.values(row).map((value: any, cellIndex) => (
                        <td key={cellIndex} className="p-2">
                          {value || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkoutImport;
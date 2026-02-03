import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, FileSpreadsheet, AlertCircle, FileText, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { Workout } from '@/types';

interface CSVRow {
  'Nome do Treino'?: string;
  'Descrição do Treino'?: string;
  'Nome do Exercício': string;
  'Séries': string;
  'Repetições': string;
  'Peso (kg)'?: string;
  'Observação'?: string;
}

const WorkoutImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [activeTab, setActiveTab] = useState("csv");
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Gerar planilha modelo
  const generateSampleFile = () => {
    const sampleData = [
      {
        'Nome do Exercício': 'Supino Reto',
        'Séries': '4',
        'Repetições': '8-10',
        'Peso (kg)': '80'
      },
      {
        'Nome do Exercício': 'Supino Inclinado',
        'Séries': '3',
        'Repetições': '10-12',
        'Peso (kg)': '70'
      },
      {
        'Nome do Exercício': 'Crucifixo',
        'Séries': '3',
        'Repetições': '12-15',
        'Peso (kg)': '25'
      },
      {
        'Nome do Exercício': 'Tríceps Pulley',
        'Séries': '3',
        'Repetições': '12-15',
        'Peso (kg)': '35'
      },
      {
        'Nome do Exercício': 'Agachamento',
        'Séries': '4',
        'Repetições': '10-12',
        'Peso (kg)': '100'
      },
      {
        'Nome do Exercício': 'Leg Press',
        'Séries': '3',
        'Repetições': '15',
        'Peso (kg)': '120'
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
    // console.log("🔍 Iniciando processamento de dados...");
    // console.log("📊 Dados brutos recebidos:", data);
    // console.log("📋 Número de linhas:", data.length);
    
    const workoutMap = new Map<string, Workout>();

    data.forEach((row, index) => {
      // console.log(`\n📝 Processando linha ${index + 1}:`, row);
      
      // Verificar se tem a coluna "Nome do Treino" ou usar nome padrão
      const workoutName = row['Nome do Treino']?.trim() || 'Treino Importado';
      const description = row['Descrição do Treino']?.trim() || '';
      const exerciseName = row['Nome do Exercício']?.trim();
      const sets = parseInt(row['Séries']) || 3;
      const reps = row['Repetições']?.trim() || '12';
      const weight = parseFloat(row['Peso (kg)']) || 0;

      // console.log("🔍 Valores extraídos:");
      // console.log("  - Nome do Treino:", workoutName);
      // console.log("  - Descrição:", description);
      // console.log("  - Nome do Exercício:", exerciseName);
      // console.log("  - Séries:", sets);
      // console.log("  - Repetições:", reps);
      // console.log("  - Peso:", weight);

      if (!exerciseName) {
        // console.log("❌ Linha ignorada - nome do exercício vazio");
        return;
      }

      if (!workoutMap.has(workoutName)) {
        // console.log("🆕 Criando novo treino:", workoutName);
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
        reps,
        notes: row['Observação']?.trim() || ''
      });
    });

    const result = Array.from(workoutMap.values());

    return result;
  };

  const parseTextWorkouts = (text: string): Workout[] => {
    const lines = text.split('\n');
    const workoutMap = new Map<string, Workout>();
    let currentWorkout: Workout | null = null;
    
    // Se a primeira linha não for um título, cria um treino padrão
    const firstLine = lines[0]?.trim();
    if (firstLine && !firstLine.startsWith('#')) {
       const defaultName = "Treino Personalizado";
       const workout: Workout = {
            id: uuidv4(),
            name: defaultName,
            exercises: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
       };
       workoutMap.set(defaultName, workout);
       currentWorkout = workout;
    }

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('#')) {
        // Novo treino
        const name = trimmed.substring(1).trim();
        if (name) {
          const workout: Workout = {
            id: uuidv4(),
            name,
            exercises: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          workoutMap.set(name, workout);
          currentWorkout = workout;
        }
      } else if (currentWorkout) {
        // Exercício
        const cleanLine = trimmed.startsWith('-') ? trimmed.substring(1).trim() : trimmed;
        const parts = cleanLine.split('|').map(p => p.trim());
        
        if (parts.length >= 1) {
          const name = parts[0];
          if (name.length < 2) return;

          const sets = parseInt(parts[1]) || 3;
          const reps = parts[2] || '12';
          const notes = parts[3] || '';
          
          if (name) {
            currentWorkout.exercises.push({
              id: uuidv4(),
              name,
              sets,
              reps,
              notes
            });
          }
        }
      }
    });

    return Array.from(workoutMap.values());
  };

  const saveWorkouts = async (workouts: Workout[]) => {
    if (workouts.length === 0) {
      toast({
        title: "Nenhum treino encontrado",
        description: "Verifique o formato dos dados.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) return;

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
        console.error("❌ Erro ao criar treino:", workoutError);
        continue;
      }

      if (workout.exercises.length > 0) {
        const exercisesToInsert = workout.exercises.map(ex => ({
          id: uuidv4(),
          workout_id: workout.id,
          name: ex.name,
          sets: ex.sets,
          reps: String(ex.reps),
          notes: ex.notes || null
        }));

        const { error: exercisesError } = await supabase
          .from('exercises')
          .insert(exercisesToInsert);

        if (exercisesError) {
          console.error("❌ Erro ao criar exercícios:", exercisesError);
        }
      }
    }

    // Atualizar localStorage
    const existingWorkouts = JSON.parse(localStorage.getItem(`workouts_${user.id}`) || '[]');
    const updatedWorkouts = [...workouts, ...existingWorkouts];
    localStorage.setItem(`workouts_${user.id}`, JSON.stringify(updatedWorkouts));

    toast({
      title: "Treinos importados",
      description: `${workouts.length} treino(s) foram criados com sucesso!`,
    });

    navigate('/workouts');
  };

  const handleTextImport = async () => {
    if (!textInput.trim()) {
        toast({ title: "Erro", description: "Cole o texto do treino.", variant: "destructive" });
        return;
    }
    
    setIsProcessing(true);
    try {
        const workouts = parseTextWorkouts(textInput);
        await saveWorkouts(workouts);
    } catch (error) {
        console.error(error);
        toast({ title: "Erro", description: "Falha ao processar texto.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
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
          await saveWorkouts(workouts);
        } catch (error) {
          console.error("❌ Erro ao processar arquivo:", error);
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
        console.error("❌ Erro ao ler arquivo:", error);
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
            Importe seus treinos a partir de uma planilha CSV ou texto simples
          </p>
        </div>
        <Button 
          onClick={() => navigate('/workouts')}
          variant="outline"
        >
          Voltar
        </Button>
      </div>

      <Tabs defaultValue="csv" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="csv">Planilha CSV</TabsTrigger>
          <TabsTrigger value="text">Texto Simples</TabsTrigger>
        </TabsList>
        
        <TabsContent value="csv" className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Formato aceito:</strong> O arquivo deve ser um CSV com pelo menos as colunas: 
              "Nome do Exercício", "Séries", "Repetições". 
              <br />
              <strong>Colunas opcionais:</strong> "Nome do Treino", "Descrição do Treino", "Peso (kg)"
              <br />
              <strong>Se não houver "Nome do Treino":</strong> Será criado um treino chamado "Treino Importado"
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
                  Carregar Arquivo
                </CardTitle>
                <CardDescription>
                  Selecione o arquivo CSV preenchido
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                
                {previewData.length > 0 && (
                  <div className="rounded-md bg-muted p-4">
                    <p className="text-sm font-medium mb-2">Prévia ({previewData.length} linhas):</p>
                    <div className="text-xs space-y-1 text-muted-foreground">
                      {previewData.map((row, i) => (
                        <div key={i}>
                          {row['Nome do Treino'] || 'Treino'} - {row['Nome do Exercício']}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleImport} 
                  disabled={!file || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? "Processando..." : "Importar Treinos"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="text" className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Como usar:</strong> Cole seu treino abaixo.
              <br />
              Use <strong># Nome do Treino</strong> para iniciar um novo treino.
              <br />
              Liste os exercícios no formato: <strong>Nome | Séries | Repetições | Observações (Opcional)</strong>
              <br />
              Exemplo:
              <br />
              # Treino de Peito
              <br />
              Supino Reto | 4 | 10 | Carga progressiva
              <br />
              Crucifixo | 3 | 12
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Colar Texto
              </CardTitle>
              <CardDescription>
                Cole a lista de exercícios e treinos diretamente aqui
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="# Treino A&#10;Supino | 4 | 10 | Cuidado com ombro&#10;Agachamento | 4 | 12"
                className="min-h-[300px] font-mono"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
              <Button 
                onClick={handleTextImport} 
                disabled={!textInput.trim() || isProcessing}
                className="w-full"
              >
                {isProcessing ? "Processando..." : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Criar Treinos
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkoutImport;
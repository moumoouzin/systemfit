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
      // console.log("➕ Adicionando exercício ao treino:", exerciseName);
      workout.exercises.push({
        id: uuidv4(),
        name: exerciseName,
        sets,
        reps
      });
    });

    const result = Array.from(workoutMap.values());
    // console.log("\n✅ Processamento concluído:");
    // console.log("📊 Treinos encontrados:", result.length);
    result.forEach((workout, index) => {
      // console.log(`  ${index + 1}. ${workout.name} - ${workout.exercises.length} exercícios`);
    });

    return result;
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

    // console.log("🚀 Iniciando importação...");
    // console.log("📁 Arquivo:", file.name);
    // console.log("👤 Usuário:", user.id);
    
    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // console.log("📊 Resultados do parsing:", results);
          // console.log("📋 Número de linhas:", results.data.length);
          // console.log("🏷️ Headers encontrados:", results.meta.fields);
          
          const data = results.data as CSVRow[];
          // console.log("🔍 Primeiras 3 linhas de dados:", data.slice(0, 3));
          
          const workouts = processWorkouts(data);

          // console.log("✅ Treinos processados:", workouts);
          // console.log("📊 Número de treinos:", workouts.length);

          if (workouts.length === 0) {
            // console.log("❌ Nenhum treino encontrado - mostrando erro");
            toast({
              title: "Nenhum treino encontrado",
              description: "Verifique se a planilha está no formato correto.",
              variant: "destructive",
            });
            setIsProcessing(false);
            return;
          }

          // console.log("💾 Iniciando salvamento no Supabase...");
          
          // Salvar treinos no Supabase
          for (const workout of workouts) {
            // console.log(`💾 Salvando treino: ${workout.name}`);
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

            // console.log(`✅ Treino salvo: ${workout.name}`);

            // Salvar exercícios
            if (workout.exercises.length > 0) {
              // console.log(`💾 Salvando ${workout.exercises.length} exercícios para ${workout.name}`);
              const exercisesToInsert = workout.exercises.map(ex => ({
                id: uuidv4(),
                workout_id: workout.id,
                name: ex.name,
                sets: ex.sets,
                reps: String(ex.reps) // Garantir que seja string
              }));

              // console.log("📝 Exercícios para inserir:", exercisesToInsert);

              const { error: exercisesError } = await supabase
                .from('exercises')
                .insert(exercisesToInsert);

              if (exercisesError) {
                console.error("❌ Erro ao criar exercícios:", exercisesError);
              } else {
                // console.log(`✅ Exercícios salvos para ${workout.name}`);
              }
            }
          }

          // console.log("💾 Atualizando localStorage...");
          
          // Atualizar localStorage
          const existingWorkouts = JSON.parse(localStorage.getItem(`workouts_${user.id}`) || '[]');
          const updatedWorkouts = [...workouts, ...existingWorkouts];
          localStorage.setItem(`workouts_${user.id}`, JSON.stringify(updatedWorkouts));

          // console.log("✅ Importação concluída com sucesso!");

          toast({
            title: "Treinos importados",
            description: `${workouts.length} treino(s) foram importados com sucesso!`,
          });

          navigate('/workouts');
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
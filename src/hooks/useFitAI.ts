
import { useState, useEffect } from 'react';
import { useActiveWorkout } from './useActiveWorkout';
import { supabase } from '@/integrations/supabase/client';
import { Workout } from '@/types';
import { toast } from '@/components/ui/use-toast';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export type FitAIConfig = {
  apiKey: string;
  model: string;
};

const DEFAULT_MODEL = "openai/gpt-4o-mini";

export const useFitAI = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Olá! Eu sou o FitChat. Configure sua API Key para começar.',
      timestamp: new Date()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [config, setConfig] = useState<FitAIConfig>({
    apiKey: localStorage.getItem('fitchat_apikey') || '',
    model: localStorage.getItem('fitchat_model') || DEFAULT_MODEL
  });

  const { startWorkout, activeWorkout, updateExerciseStatus } = useActiveWorkout();

  useEffect(() => {
    const loadConfig = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: settings } = await supabase
        .from('user_settings')
        .select('key, value')
        .eq('user_id', user.id);

      if (settings) {
        const newConfig = { ...config };
        settings.forEach(setting => {
          if (setting.key === 'fitchat_apikey') newConfig.apiKey = setting.value;
          if (setting.key === 'fitchat_model') newConfig.model = setting.value;
        });
        setConfig(newConfig);
      }
    };
    loadConfig();
  }, []);

  const updateConfig = async (newConfig: Partial<FitAIConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    
    // Local persistence
    if (newConfig.apiKey !== undefined) localStorage.setItem('fitchat_apikey', newConfig.apiKey);
    if (newConfig.model !== undefined) localStorage.setItem('fitchat_model', newConfig.model);

    // Supabase persistence
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (newConfig.apiKey !== undefined) {
        await supabase.from('user_settings').upsert({ 
          user_id: user.id, 
          key: 'fitchat_apikey', 
          value: newConfig.apiKey 
        });
      }
      if (newConfig.model !== undefined) {
        await supabase.from('user_settings').upsert({ 
          user_id: user.id, 
          key: 'fitchat_model', 
          value: newConfig.model 
        });
      }
    }
  };

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      role,
      content,
      timestamp: new Date()
    }]);
  };

  const executeAction = async (action: any) => {
    console.log("Executing AI Action:", action);
    
    if (action.type === "start_workout") {
      const workoutId = action.workoutId;
      if (workoutId) {
        // Precisamos buscar o objeto completo do treino com os exercícios
        const { data: workoutData, error } = await supabase
          .from('workouts')
          .select('*, exercises(*)')
          .eq('id', workoutId)
          .single();

        if (error || !workoutData) {
          console.error("Erro ao buscar detalhes do treino:", error);
          return "Erro ao iniciar: Treino não encontrado no banco de dados.";
        }

        // Converter para o tipo Workout esperado pelo hook
        // O Supabase retorna exercises como um array de objetos se usarmos o select com join
        const workoutToStart: Workout = {
            id: workoutData.id,
            name: workoutData.name,
            exercises: workoutData.exercises as any, 
            createdAt: workoutData.created_at,
            updatedAt: workoutData.updated_at
        };

        const success = await startWorkout(workoutToStart); // startWorkout retorna boolean ou void? No hook é void mas na logica parece ser async
        
        // Verificando implementação do startWorkout: ele retorna true/false
        // Mas no hook useActiveWorkout exportado, precisamos ver se ele expõe o retorno.
        // Assumindo que sim.
        
        return `Comando enviado para iniciar o treino "${workoutData.name}".`;
      }
      return "Erro: ID do treino não fornecido.";
    }

    if (action.type === "log_set") {
      const { exerciseId, reps, weight } = action;
      if (!activeWorkout) return "Erro: Nenhum treino ativo no momento.";
      
      const currentStatus = activeWorkout.exerciseStatus.find(s => s.id === exerciseId);
      const exerciseName = activeWorkout.exercises.find(e => e.id === exerciseId)?.name || "Exercício";
      
      let nextSetNumber = 1;
      if (currentStatus && currentStatus.sets && currentStatus.sets.length > 0) {
        const lastSet = currentStatus.sets[currentStatus.sets.length - 1];
        if (lastSet.completed) {
            nextSetNumber = lastSet.setNumber + 1;
        } else {
            nextSetNumber = lastSet.setNumber;
        }
      }

      const existingSets = currentStatus?.sets || [];
      const newSet = {
          setNumber: nextSetNumber,
          reps: parseInt(reps),
          weight: parseInt(weight),
          completed: true
      };
      
      const otherSets = existingSets.filter(s => s.setNumber !== nextSetNumber);
      const updatedSets = [...otherSets, newSet].sort((a,b) => a.setNumber - b.setNumber);
      
      await updateExerciseStatus(exerciseId, { sets: updatedSets });
      return `Série registrada com sucesso para ${exerciseName}: ${reps} reps, ${weight}kg (Série ${nextSetNumber}).`;
    }

    return "Ação desconhecida.";
  };

  const processMessage = async (userMessage: string) => {
    addMessage('user', userMessage);
    
    if (!config.apiKey) {
      addMessage('assistant', 'Por favor, configure sua API Key do OpenRouter nas configurações.');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Coletar Contexto
      let context = "";
      
      // Buscar treinos disponíveis
      const { data: workouts } = await supabase.from('workouts').select('id, name');
      const availableWorkouts = workouts ? workouts.map(w => `ID: ${w.id}, Nome: ${w.name}`).join('\n') : "Nenhum treino encontrado.";
      
      context += `\nTREINOS DISPONÍVEIS:\n${availableWorkouts}\n`;

      if (activeWorkout) {
        const exercisesList = activeWorkout.exercises.map(e => `ID: ${e.id}, Nome: ${e.name}`).join('\n');
        context += `\nTREINO ATIVO AGORA: ${activeWorkout.workoutName}\nEXERCÍCIOS DO TREINO ATIVO:\n${exercisesList}\n`;
      } else {
        context += `\nNENHUM TREINO ATIVO NO MOMENTO.\n`;
      }

      // 2. Montar System Prompt
      const systemPrompt = `
Você é o FitChat AI, um assistente pessoal de academia inteligente.
Sua missão é ajudar o usuário a gerenciar seus treinos.
Você tem acesso ao contexto atual do usuário (treinos disponíveis, treino ativo).

IMPORTANTE: Você pode executar ações no aplicativo respondendo com um JSON estrito.
Se o usuário pedir para realizar uma ação, analise o contexto e responda APENAS o JSON da ação.
Se for apenas conversa ou dúvida, responda em texto normal.

AÇÕES DISPONÍVEIS (Responda APENAS o JSON se for executar):

1. INICIAR TREINO:
{
  "action": "start_workout",
  "workoutId": "ID_DO_TREINO_ENCONTRADO_NO_CONTEXTO"
}
Use isso quando o usuário disser "Iniciar treino de X". Procure o ID correspondente no contexto.

2. REGISTRAR SÉRIE (Apenas se houver treino ativo):
{
  "action": "log_set",
  "exerciseId": "ID_DO_EXERCICIO_ENCONTRADO_NO_CONTEXTO",
  "reps": 10,
  "weight": 20
}
Use isso quando o usuário disser "Fiz 10 reps com 20kg no supino". Encontre o ID do exercício pelo nome.

REGRAS:
- Se não encontrar o treino ou exercício exato, peça clarificação ao usuário.
- Se for executar uma ação, NÃO escreva nada além do JSON.
- Se for conversa, seja motivador e breve.
- O contexto atual está abaixo. Use os IDs reais fornecidos.

CONTEXTO:
${context}
      `;

      // 3. Chamar OpenRouter
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "SystemFit"
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.filter(m => m.id !== 'welcome').map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage }
          ],
          temperature: 0.2 // Baixa temperatura para precisão em comandos
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiContent = data.choices[0]?.message?.content || "";

      // 4. Processar Resposta
      let processedContent = aiContent;

      // Tentar detectar JSON
      try {
        // As vezes a IA coloca markdown ```json ... ```
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          const actionData = JSON.parse(jsonStr);
          
          if (actionData.action) {
             // É uma ação! Executar.
             const resultMsg = await executeAction({
               type: actionData.action,
               ...actionData
             });
             processedContent = resultMsg;
             // Opcional: Poderíamos fazer uma segunda chamada para a IA gerar uma resposta amigável baseada no resultado,
             // mas por enquanto vamos mostrar o resultado direto.
          }
        }
      } catch (e) {
        console.log("Resposta não é JSON ou erro no parse, tratando como texto normal.");
      }

      addMessage('assistant', processedContent);

    } catch (error) {
      console.error('FitChat Error:', error);
      addMessage('assistant', 'Desculpe, ocorreu um erro ao comunicar com a IA.');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    messages,
    processMessage,
    isProcessing,
    config,
    updateConfig
  };
};

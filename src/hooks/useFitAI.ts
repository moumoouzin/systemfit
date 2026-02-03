
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

  // Carregar mensagens salvas
  useEffect(() => {
    const savedMessages = localStorage.getItem('fitchat_messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        // Recriar objetos Date
        const hydrated = parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        setMessages(hydrated);
      } catch (e) {
        console.error('Failed to load messages', e);
      }
    }
  }, []);

  // Salvar mensagens quando mudarem
  useEffect(() => {
    if (messages.length > 1) { // Só salva se tiver mais que a mensagem inicial
      localStorage.setItem('fitchat_messages', JSON.stringify(messages));
    }
  }, [messages]);

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

  // Função auxiliar para extrair JSONs da resposta
  const extractJsonActions = (text: string): any[] => {
    const actions: any[] = [];
    // Regex para encontrar objetos JSON. Tenta lidar com blocos de código e objetos soltos
    const jsonRegex = /\{[\s\S]*?\}/g;
    const matches = text.match(jsonRegex);

    if (matches) {
      for (const match of matches) {
        try {
          // Tenta limpar o match de possíveis caracteres markdown residuais se necessário
          const cleanMatch = match.trim();
          const parsed = JSON.parse(cleanMatch);
          if (parsed.action) {
            actions.push(parsed);
          }
        } catch (e) {
          // Ignora falhas de parse individuais
        }
      }
    }
    return actions;
  };

  const executeAction = async (action: any, currentWorkoutState: any) => {
    // console.log("Executing AI Action:", action);
    
    // Normaliza o tipo da ação (aceita tanto "type" quanto "action" vindo do JSON)
    const actionType = action.type || action.action;
    
    if (actionType === "start_workout") {
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
          return { message: "Erro ao iniciar: Treino não encontrado no banco de dados.", updatedWorkout: currentWorkoutState };
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

        await startWorkout(workoutToStart);
        return { message: `Comando enviado para iniciar o treino "${workoutData.name}".`, updatedWorkout: currentWorkoutState };
      }
      return { message: "Erro: ID do treino não fornecido.", updatedWorkout: currentWorkoutState };
    }

    if (actionType === "log_set") {
      const { exerciseId, reps, weight, setNumber } = action;
      
      // Usa o estado passado ou o atual do hook
      const workoutState = currentWorkoutState || activeWorkout;
      
      if (!workoutState) return { message: "Erro: Nenhum treino ativo no momento.", updatedWorkout: workoutState };
      
      const currentStatus = workoutState.exerciseStatus.find((s: any) => s.id === exerciseId);
      const exerciseName = workoutState.exercises.find((e: any) => e.id === exerciseId)?.name || "Exercício";
      
      let targetSetNumber = 1;
      const existingSets = currentStatus?.sets || [];
      
      // Se o usuário especificou o número da série (edição explícita)
      if (setNumber) {
        targetSetNumber = parseInt(setNumber);
      } else {
        // Lógica de preenchimento inteligente:
        // 1. Procura a primeira série incompleta (não marcada como completed e com valores zerados/padrão)
        // 2. Se todas completas, cria uma nova
        
        // Encontrar a primeira série que não está completada e parece vazia (reps 0 ou weight 0)
        // ou apenas não completada.
        const firstIncompleteSet = existingSets.find((s: any) => !s.completed);
        
        if (firstIncompleteSet) {
          targetSetNumber = firstIncompleteSet.setNumber;
        } else {
          // Se todas completas, pega o último número + 1
          if (existingSets.length > 0) {
            const lastSet = existingSets[existingSets.length - 1];
            targetSetNumber = lastSet.setNumber + 1;
          } else {
            targetSetNumber = 1;
          }
        }
      }

      const newSet = {
          setNumber: targetSetNumber,
          reps: parseInt(reps),
          weight: parseInt(weight),
          completed: true
      };
      
      const otherSets = existingSets.filter((s: any) => s.setNumber !== targetSetNumber);
      const updatedSets = [...otherSets, newSet].sort((a: any,b: any) => a.setNumber - b.setNumber);
      
      // Atualiza no banco
      await updateExerciseStatus(exerciseId, { sets: updatedSets });

      // Atualiza o estado local temporário para a próxima iteração
      const updatedExerciseStatus = workoutState.exerciseStatus.map((s: any) => 
        s.id === exerciseId ? { ...s, sets: updatedSets } : s
      );
      
      const newWorkoutState = {
          ...workoutState,
          exerciseStatus: updatedExerciseStatus
      };

      return { 
          message: `Série ${targetSetNumber} registrada: ${exerciseName} - ${reps}x${weight}kg.`, 
          updatedWorkout: newWorkoutState 
      };
    }

    return { message: "Ação desconhecida: " + JSON.stringify(action), updatedWorkout: currentWorkoutState };
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
Se houver múltiplas ações (ex: várias séries), responda com múltiplos objetos JSON em sequência ou uma lista de objetos.

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
  "weight": 20,
  "setNumber": 1 
}
Use isso quando o usuário disser "Fiz 10 reps com 20kg no supino". Encontre o ID do exercício pelo nome.
O campo "setNumber" é opcional. Se o usuário disser "Corrija a série 1 para 20kg", inclua "setNumber": 1. Caso contrário, não envie esse campo e a lógica preencherá a próxima série vazia.

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
      let finalMessage = "";

      // Extrair todas as ações possíveis
      const actions = extractJsonActions(aiContent);
      
      if (actions.length > 0) {
        let currentWorkoutState = activeWorkout; // Estado inicial para encadeamento
        const results = [];

        for (const action of actions) {
          const result = await executeAction(action, currentWorkoutState);
          results.push(result.message);
          if (result.updatedWorkout) {
            currentWorkoutState = result.updatedWorkout;
          }
        }
        
        // Remove os JSONs da mensagem final para mostrar apenas o texto (se houver) ou os resultados
        // Se a resposta for SÓ JSON, mostramos os resultados das ações.
        // Se tiver texto misturado, mostramos o texto + resultados.
        
        // Estratégia simples: Se executou ações, a resposta da IA é substituída pelo log das ações.
        // A menos que a IA tenha falado algo útil que não seja JSON.
        const textWithoutJson = aiContent.replace(/\{[\s\S]*?\}/g, "").trim();
        
        if (textWithoutJson) {
           finalMessage = `${textWithoutJson}\n\n✅ Ações realizadas:\n${results.join('\n')}`;
        } else {
           finalMessage = `✅ Ações realizadas:\n${results.join('\n')}`;
        }
      } else {
        finalMessage = aiContent;
      }

      addMessage('assistant', finalMessage);

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

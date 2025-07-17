import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface DraftWorkout {
  id: string;
  name: string;
  description?: string;
  exercises: Array<{
    id: string;
    name: string;
    sets: number;
    reps: string;
    notes?: string;
    lastWeight?: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const useDraftWorkout = () => {
  const { user } = useAuth();
  const [draft, setDraft] = useState<DraftWorkout | null>(null);

  const getDraftKey = () => `workout_draft_${user?.id}`;

  // Carregar rascunho existente
  useEffect(() => {
    if (user?.id) {
      const savedDraft = localStorage.getItem(getDraftKey());
      if (savedDraft) {
        try {
          setDraft(JSON.parse(savedDraft));
        } catch (error) {
          console.error('Erro ao carregar rascunho:', error);
          localStorage.removeItem(getDraftKey());
        }
      }
    }
  }, [user?.id]);

  // Salvar rascunho
  const saveDraft = useCallback((draftData: DraftWorkout) => {
    if (!user?.id) return;
    
    const updatedDraft = {
      ...draftData,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(getDraftKey(), JSON.stringify(updatedDraft));
    setDraft(updatedDraft);
  }, [user?.id]);

  // Deletar rascunho
  const deleteDraft = useCallback(() => {
    if (!user?.id) return;
    
    localStorage.removeItem(getDraftKey());
    setDraft(null);
  }, [user?.id]);

  // Verificar se existe rascunho
  const hasDraft = draft !== null;

  return {
    draft,
    saveDraft,
    deleteDraft,
    hasDraft
  };
};
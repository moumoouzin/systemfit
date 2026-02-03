import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AppState {
  timestamp: number;
  url: string;
  isPWA: boolean;
  scrollPosition: number;
  userAuthenticated: boolean;
  activeWorkoutId?: string;
}

export const useAppStateManager = () => {
  const stateRef = useRef<AppState | null>(null);
  const isRecoveringRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Salvar estado da aplicação
  const saveAppState = useCallback((additionalData?: Partial<AppState>) => {
    const state: AppState = {
      timestamp: Date.now(),
      url: window.location.href,
      isPWA: window.matchMedia('(display-mode: standalone)').matches,
      scrollPosition: window.scrollY,
      userAuthenticated: false, // Será verificado quando necessário
      ...additionalData
    };
    
    stateRef.current = state;
    localStorage.setItem('systemfit-app-state', JSON.stringify(state));
    // console.log('App state saved:', state);
  }, []);

  // Carregar estado da aplicação
  const loadAppState = useCallback((): AppState | null => {
    try {
      const saved = localStorage.getItem('systemfit-app-state');
      if (saved) {
        const state = JSON.parse(saved) as AppState;
        stateRef.current = state;
        // console.log('App state loaded:', state);
        return state;
      }
    } catch (error) {
      console.error('Error loading app state:', error);
    }
    return null;
  }, []);

  // Verificar se precisa recuperar estado
  const shouldRecoverState = useCallback((currentState: AppState | null): boolean => {
    if (!currentState) return false;
    
    const timeSinceLastSave = Date.now() - currentState.timestamp;
    const isSignificantTime = timeSinceLastSave > 2000; // 2 segundos (reduzido para ser mais responsivo)
    const isDifferentUrl = currentState.url !== window.location.href;
    
    // console.log('Recovery check:', {
    //   timeSinceLastSave,
    //   isSignificantTime,
    //   isDifferentUrl,
    //   shouldRecover: isSignificantTime || isDifferentUrl
    // });
    
    return isSignificantTime || isDifferentUrl;
  }, []);

  // Recuperar estado da aplicação
  const recoverAppState = useCallback(async () => {
    if (isRecoveringRef.current) return;
    
    isRecoveringRef.current = true;
    retryCountRef.current = 0;
    
    // console.log('Starting app state recovery...');
    
    try {
      // Verificar autenticação
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error during recovery:', sessionError);
        throw sessionError;
      }
      
      if (!session) {
        // console.log('No active session during recovery');
        isRecoveringRef.current = false;
        return;
      }
      
      // console.log('Session verified during recovery');
      
      // Disparar eventos de recuperação
      window.dispatchEvent(new CustomEvent('app-state-recovery', {
        detail: { session, timestamp: Date.now() }
      }));
      
      // Limpar estado salvo após recuperação bem-sucedida
      localStorage.removeItem('systemfit-app-state');
      stateRef.current = null;
      
    } catch (error) {
      console.error('Error during app state recovery:', error);
      
      // Retry logic
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        const delay = Math.pow(2, retryCountRef.current) * 1000; // Exponential backoff
        
        // console.log(`Retrying recovery in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
        
        setTimeout(() => {
          isRecoveringRef.current = false;
          recoverAppState();
        }, delay);
      } else {
        console.error('Max retries reached for app state recovery');
        isRecoveringRef.current = false;
      }
    }
  }, []);

  // Verificar conexão com Supabase
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      console.error('Connection check failed:', error);
      return false;
    }
  }, []);

  // Gerenciar eventos de visibilidade
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        saveAppState();
      } else {
        window.dispatchEvent(new CustomEvent('app-foreground-refresh'));
        const savedState = loadAppState();
        
        if (shouldRecoverState(savedState)) {
          await recoverAppState();
        }
      }
    };

    const handleBeforeUnload = () => {
      // console.log('Page unloading - saving state');
      saveAppState();
    };

    const handleFocus = async () => {
      // console.log('Window focused - checking connection');
      const isConnected = await checkConnection();
      
      if (!isConnected) {
        // console.log('Connection lost - triggering recovery');
        await recoverAppState();
      }
    };

    const handleBlur = () => {
      // console.log('Window blurred - saving state');
      saveAppState();
    };

    // Event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Verificar estado ao carregar
    const savedState = loadAppState();
    if (shouldRecoverState(savedState)) {
      recoverAppState();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [saveAppState, loadAppState, shouldRecoverState, recoverAppState, checkConnection]);

  return {
    saveAppState,
    loadAppState,
    recoverAppState,
    checkConnection
  };
};

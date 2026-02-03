import { useEffect, useRef } from 'react';

export const usePageVisibility = () => {
  const isVisible = useRef(true);
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Página ficou invisível - salvar estado
        console.log('Page became hidden - saving state');
        isVisible.current = false;
        lastActivity.current = Date.now();
        
        // Salvar estado no localStorage para recuperação
        const stateToSave = {
          timestamp: Date.now(),
          url: window.location.href,
          scrollPosition: window.scrollY,
        };
        
        localStorage.setItem('systemfit-page-state', JSON.stringify(stateToSave));
      } else {
        // Página ficou visível - restaurar estado se necessário
        console.log('Page became visible - checking state');
        isVisible.current = true;
        
        // Verificar se precisa restaurar estado
        const savedState = localStorage.getItem('systemfit-page-state');
        if (savedState) {
          try {
            const state = JSON.parse(savedState);
            const timeDiff = Date.now() - state.timestamp;
            
            // Se passou mais de 5 minutos, pode ser necessário recarregar
                  if (timeDiff > 5 * 60 * 1000) {
                    // console.log('Page was hidden for too long - may need refresh');
                    // Não recarregar automaticamente, mas avisar o usuário
                  }
          } catch (error) {
            console.error('Error parsing saved state:', error);
          }
        }
      }
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Salvar estado antes de sair
      const stateToSave = {
        timestamp: Date.now(),
        url: window.location.href,
        scrollPosition: window.scrollY,
      };
      
      localStorage.setItem('systemfit-page-state', JSON.stringify(stateToSave));
    };

    const handleFocus = () => {
      isVisible.current = true;
      lastActivity.current = Date.now();
    };

    const handleBlur = () => {
      isVisible.current = false;
      lastActivity.current = Date.now();
    };

    // Adicionar listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return {
    isVisible: isVisible.current,
    lastActivity: lastActivity.current,
  };
};

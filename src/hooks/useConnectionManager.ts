import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useConnectionManager = () => {
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const isConnected = useRef(true);

  useEffect(() => {
    // Função para verificar conexão
    const checkConnection = async () => {
      try {
        // Fazer uma consulta simples para verificar se a conexão está ativa
        const { error } = await supabase
          .from('user_profiles')
          .select('id')
          .limit(1);
        
        if (error) {
          console.warn('Connection check failed:', error);
          isConnected.current = false;
          
          // Disparar evento de perda de conexão
          window.dispatchEvent(new CustomEvent('connection-lost'));
        } else {
          if (!isConnected.current) {
            // console.log('Connection restored');
            isConnected.current = true;
            
            // Disparar evento de reconexão
            window.dispatchEvent(new CustomEvent('connection-restored'));
          }
        }
      } catch (error) {
        console.warn('Connection check error:', error);
        isConnected.current = false;
        window.dispatchEvent(new CustomEvent('connection-lost'));
      }
    };

    // Verificar conexão a cada 30 segundos
    heartbeatInterval.current = setInterval(checkConnection, 30000);

    // Verificar conexão imediatamente
    checkConnection();

    // Verificar conexão quando a página fica visível
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkConnection();
      }
    };

    // Verificar conexão quando a janela ganha foco
    const handleFocus = () => {
      checkConnection();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return {
    isConnected: isConnected.current,
  };
};

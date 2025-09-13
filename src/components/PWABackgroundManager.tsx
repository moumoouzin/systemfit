import { useEffect } from 'react';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { usePWA } from '@/hooks/usePWA';

interface PWABackgroundManagerProps {
  children: React.ReactNode;
}

export const PWABackgroundManager = ({ children }: PWABackgroundManagerProps) => {
  const { isVisible } = usePageVisibility();
  const { isInstalled } = usePWA();

  useEffect(() => {
    // Configurar comportamento específico para PWA
    if (isInstalled) {
      // Prevenir que o app seja fechado inadvertidamente
      const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        // Salvar estado antes de sair
        const stateToSave = {
          timestamp: Date.now(),
          url: window.location.href,
          isPWA: true,
        };
        
        localStorage.setItem('systemfit-pwa-state', JSON.stringify(stateToSave));
      };

      // Prevenir fechamento acidental em mobile
      const handleVisibilityChange = () => {
        if (document.hidden) {
          // App foi para background - salvar estado
          console.log('PWA went to background - saving state');
          
          // Salvar estado do app
          const appState = {
            timestamp: Date.now(),
            url: window.location.href,
            isPWA: true,
            scrollPosition: window.scrollY,
          };
          
          localStorage.setItem('systemfit-pwa-state', JSON.stringify(appState));
        } else {
          // App voltou do background - verificar se precisa restaurar
          console.log('PWA returned from background');
          
          const savedState = localStorage.getItem('systemfit-pwa-state');
          if (savedState) {
            try {
              const state = JSON.parse(savedState);
              const timeDiff = Date.now() - state.timestamp;
              
              // Se passou muito tempo, pode ser necessário recarregar dados
              if (timeDiff > 10 * 60 * 1000) { // 10 minutos
                console.log('PWA was in background for too long - refreshing data');
                // Disparar evento para recarregar dados se necessário
                window.dispatchEvent(new CustomEvent('pwa-background-refresh'));
              }
            } catch (error) {
              console.error('Error parsing saved PWA state:', error);
            }
          }
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isInstalled]);

  // Configurar meta tags para melhor comportamento em background
  useEffect(() => {
    if (isInstalled) {
      // Adicionar meta tag para prevenir sleep em background
      const metaTag = document.createElement('meta');
      metaTag.name = 'mobile-web-app-capable';
      metaTag.content = 'yes';
      document.head.appendChild(metaTag);

      // Configurar para manter o app ativo
      const keepAlive = () => {
        // Enviar ping para manter conexão ativa
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'KEEP_ALIVE' });
        }
      };

      // Ping a cada 30 segundos quando em background
      const interval = setInterval(keepAlive, 30000);

      return () => {
        clearInterval(interval);
        // Remover meta tag se existir
        const existingMeta = document.querySelector('meta[name="mobile-web-app-capable"]');
        if (existingMeta) {
          existingMeta.remove();
        }
      };
    }
  }, [isInstalled]);

  return <>{children}</>;
};

import { useEffect } from 'react';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { usePWA } from '@/hooks/usePWA';

interface PWABackgroundManagerProps {
  children: React.ReactNode;
}

export const PWABackgroundManager = ({ children }: PWABackgroundManagerProps) => {
  const { isVisible } = usePageVisibility();
  const { isInstalled } = usePWA();

  // O gerenciamento de estado agora é feito pelo useAppStateManager
  // Este componente foca apenas em funcionalidades específicas do PWA

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

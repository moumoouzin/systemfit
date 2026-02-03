import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

export const usePWA = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar se o PWA está instalado
    const checkInstallation = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };

    checkInstallation();

    const updateSW = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
      onRegistered(swRegistration) {
              // console.log('SW registered: ', swRegistration);
            },
            onRegisterError(error) {
              // console.log('SW registration error', error);
            },
    });

    // Listener para mudanças de display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      setIsInstalled(mediaQuery.matches);
    };

    mediaQuery.addEventListener('change', handleDisplayModeChange);

    // Listener para quando o app é instalado
    const handleAppInstalled = () => {
      setIsInstalled(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      updateSW();
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return {
    needRefresh,
    offlineReady,
    close,
    isInstalled,
  };
}; 
import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

export const usePWA = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
      onRegistered(swRegistration) {
        console.log('SW registered: ', swRegistration);
      },
      onRegisterError(error) {
        console.log('SW registration error', error);
      },
    });

    return () => {
      updateSW();
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
  };
}; 
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface PWAStatus {
  isInstalled: boolean;
  isStandalone: boolean;
  isOnline: boolean;
  hasServiceWorker: boolean;
  canInstall: boolean;
  installPrompt: any;
  manifest: any;
  serviceWorkerRegistration: any;
}

export function PWADebug() {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isStandalone: false,
    isOnline: navigator.onLine,
    hasServiceWorker: false,
    canInstall: false,
    installPrompt: null,
    manifest: null,
    serviceWorkerRegistration: null,
  });

  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);

  useEffect(() => {
    const checkPWAStatus = async () => {
      // Verificar se está em modo standalone (instalado)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;

      // Verificar se tem service worker
      let hasServiceWorker = false;
      let serviceWorkerRegistration = null;
      if ('serviceWorker' in navigator) {
        try {
          serviceWorkerRegistration = await navigator.serviceWorker.getRegistration();
          hasServiceWorker = !!serviceWorkerRegistration;
        } catch (error) {
          console.error('Erro ao verificar service worker:', error);
        }
      }

      // Verificar manifest
      let manifest = null;
      try {
        const response = await fetch('/manifest.webmanifest');
        if (response.ok) {
          manifest = await response.json();
        }
      } catch (error) {
        console.error('Erro ao carregar manifest:', error);
      }

      // Verificar se pode instalar
      let canInstall = false;
      if ('BeforeInstallPromptEvent' in window) {
        canInstall = true;
      }

      setStatus({
        isInstalled: isStandalone,
        isStandalone,
        isOnline: navigator.onLine,
        hasServiceWorker,
        canInstall,
        installPrompt: null,
        manifest,
        serviceWorkerRegistration,
      });
    };

    // Listener para evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
      setStatus(prev => ({ ...prev, canInstall: true, installPrompt: e }));
    };

    // Listener para mudança de conectividade
    const handleOnline = () => setStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false }));

    // Listener para mudança de display mode
    const handleDisplayModeChange = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      setStatus(prev => ({ ...prev, isInstalled: isStandalone, isStandalone }));
    };

    checkPWAStatus();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.matchMedia('(display-mode: standalone)').addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const handleInstall = async () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      const { outcome } = await installPromptEvent.userChoice;
      console.log('Resultado da instalação:', outcome);
      setInstallPromptEvent(null);
      setStatus(prev => ({ ...prev, canInstall: false, installPrompt: null }));
    }
  };

  const handleForceInstall = () => {
    // Forçar instalação manual
    if (navigator.share) {
      navigator.share({
        title: 'SystemFit',
        text: 'Instale o SystemFit como app!',
        url: window.location.href,
      });
    } else {
      // Fallback: copiar URL
      navigator.clipboard.writeText(window.location.href);
      alert('URL copiada! Cole no Chrome e use "Adicionar à tela inicial"');
    }
  };

  const getStatusColor = (condition: boolean) => condition ? 'bg-green-500' : 'bg-red-500';
  const getStatusText = (condition: boolean) => condition ? 'OK' : 'FALHA';

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Debug PWA - Chrome
          <Badge variant={status.isInstalled ? 'default' : 'secondary'}>
            {status.isInstalled ? 'INSTALADO' : 'NÃO INSTALADO'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 border rounded">
            <span>Modo Standalone:</span>
            <Badge className={getStatusColor(status.isStandalone)}>
              {getStatusText(status.isStandalone)}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 border rounded">
            <span>Online:</span>
            <Badge className={getStatusColor(status.isOnline)}>
              {getStatusText(status.isOnline)}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 border rounded">
            <span>Service Worker:</span>
            <Badge className={getStatusColor(status.hasServiceWorker)}>
              {getStatusText(status.hasServiceWorker)}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 border rounded">
            <span>Pode Instalar:</span>
            <Badge className={getStatusColor(status.canInstall)}>
              {getStatusText(status.canInstall)}
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="font-semibold">Manifest:</h4>
          {status.manifest ? (
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(status.manifest, null, 2)}
            </pre>
          ) : (
            <p className="text-red-500 text-sm">Manifest não encontrado</p>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="font-semibold">Ações:</h4>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleInstall} 
              disabled={!status.canInstall}
              size="sm"
            >
              Instalar PWA
            </Button>
            <Button 
              onClick={handleForceInstall}
              variant="outline"
              size="sm"
            >
              Forçar Instalação
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              Recarregar
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="font-semibold">Instruções para Chrome:</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Abra o Chrome no celular</li>
            <li>Acesse: <code className="bg-gray-100 px-1 rounded">{window.location.href}</code></li>
            <li>Toque no menu (3 pontos)</li>
            <li>Selecione "Adicionar à tela inicial"</li>
            <li>Confirme a instalação</li>
          </ol>
        </div>

        <Separator />

        <div className="text-xs text-gray-500">
          <p><strong>User Agent:</strong> {navigator.userAgent}</p>
          <p><strong>URL:</strong> {window.location.href}</p>
          <p><strong>Display Mode:</strong> {window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'}</p>
        </div>
      </CardContent>
    </Card>
  );
} 
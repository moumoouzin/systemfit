import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export const PWADebug = () => {
  const [pwaStatus, setPwaStatus] = useState<{
    isInstalled: boolean;
    isStandalone: boolean;
    hasServiceWorker: boolean;
    hasManifest: boolean;
    canInstall: boolean;
  }>({
    isInstalled: false,
    isStandalone: false,
    hasServiceWorker: false,
    hasManifest: false,
    canInstall: false,
  });

  useEffect(() => {
    const checkPWAStatus = async () => {
      // Verificar se está instalado como PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      
      // Verificar se tem service worker
      const hasServiceWorker = 'serviceWorker' in navigator;
      
      // Verificar se tem manifest
      const hasManifest = !!document.querySelector('link[rel="manifest"]');
      
      // Verificar se pode instalar
      const canInstall = 'BeforeInstallPromptEvent' in window;
      
      setPwaStatus({
        isInstalled: isStandalone,
        isStandalone,
        hasServiceWorker,
        hasManifest,
        canInstall,
      });
    };

    checkPWAStatus();
  }, []);

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  const getStatusText = (status: boolean) => {
    return status ? '✅ Funcionando' : '❌ Não funcionando';
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Info className="h-5 w-5" />
          Debug PWA
        </CardTitle>
        <CardDescription>
          Status do Progressive Web App
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Instalado como PWA:</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(pwaStatus.isInstalled)}
            <span className="text-sm">{getStatusText(pwaStatus.isInstalled)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Modo Standalone:</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(pwaStatus.isStandalone)}
            <span className="text-sm">{getStatusText(pwaStatus.isStandalone)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Service Worker:</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(pwaStatus.hasServiceWorker)}
            <span className="text-sm">{getStatusText(pwaStatus.hasServiceWorker)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Manifest:</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(pwaStatus.hasManifest)}
            <span className="text-sm">{getStatusText(pwaStatus.hasManifest)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Pode instalar:</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(pwaStatus.canInstall)}
            <span className="text-sm">{getStatusText(pwaStatus.canInstall)}</span>
          </div>
        </div>

        <div className="pt-3 border-t">
          <p className="text-xs text-gray-600">
            <strong>Como testar:</strong><br/>
            1. Abra no Chrome DevTools (F12)<br/>
            2. Vá para Application → Manifest<br/>
            3. Vá para Application → Service Workers<br/>
            4. No celular, deve aparecer "Adicionar à tela inicial"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}; 
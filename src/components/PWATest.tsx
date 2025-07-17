import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface PWARequirement {
  name: string;
  description: string;
  check: () => boolean | Promise<boolean>;
  critical: boolean;
}

export function PWATest() {
  const [requirements, setRequirements] = useState<Array<PWARequirement & { status: boolean | null }>>([]);
  const [isChecking, setIsChecking] = useState(true);

  const pwaRequirements: PWARequirement[] = [
    {
      name: 'HTTPS ou localhost',
      description: 'PWA requer HTTPS em produção ou localhost para desenvolvimento',
      check: () => window.location.protocol === 'https:' || window.location.hostname === 'localhost',
      critical: true
    },
    {
      name: 'Manifest válido',
      description: 'Arquivo manifest.webmanifest deve estar acessível',
      check: async () => {
        try {
          const response = await fetch('/manifest.webmanifest');
          if (!response.ok) return false;
          const manifest = await response.json();
          return manifest.name && manifest.short_name && manifest.icons && manifest.icons.length > 0;
        } catch {
          return false;
        }
      },
      critical: true
    },
    {
      name: 'Service Worker',
      description: 'Service Worker deve estar registrado e ativo',
      check: async () => {
        if (!('serviceWorker' in navigator)) return false;
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          return !!registration && registration.active;
        } catch {
          return false;
        }
      },
      critical: true
    },
    {
      name: 'Ícones PNG',
      description: 'Ícones PNG devem estar acessíveis',
      check: async () => {
        try {
          const response192 = await fetch('/pwa-192x192.png');
          const response512 = await fetch('/pwa-512x512.png');
          return response192.ok && response512.ok;
        } catch {
          return false;
        }
      },
      critical: true
    },
    {
      name: 'Display Standalone',
      description: 'Manifest deve ter display: standalone',
      check: async () => {
        try {
          const response = await fetch('/manifest.webmanifest');
          const manifest = await response.json();
          return manifest.display === 'standalone';
        } catch {
          return false;
        }
      },
      critical: true
    },
    {
      name: 'Ícone 512x512',
      description: 'Deve ter ícone de pelo menos 512x512 pixels',
      check: async () => {
        try {
          const response = await fetch('/manifest.webmanifest');
          const manifest = await response.json();
          return manifest.icons.some((icon: any) => 
            icon.sizes === '512x512' && icon.type === 'image/png'
          );
        } catch {
          return false;
        }
      },
      critical: true
    },
    {
      name: 'Ícone Maskable',
      description: 'Deve ter ícone com purpose: maskable',
      check: async () => {
        try {
          const response = await fetch('/manifest.webmanifest');
          const manifest = await response.json();
          return manifest.icons.some((icon: any) => 
            icon.purpose && icon.purpose.includes('maskable')
          );
        } catch {
          return false;
        }
      },
      critical: false
    },
    {
      name: 'Start URL',
      description: 'Manifest deve ter start_url válido',
      check: async () => {
        try {
          const response = await fetch('/manifest.webmanifest');
          const manifest = await response.json();
          return manifest.start_url && manifest.start_url.startsWith('/');
        } catch {
          return false;
        }
      },
      critical: true
    },
    {
      name: 'Scope',
      description: 'Manifest deve ter scope válido',
      check: async () => {
        try {
          const response = await fetch('/manifest.webmanifest');
          const manifest = await response.json();
          return manifest.scope && manifest.scope.startsWith('/');
        } catch {
          return false;
        }
      },
      critical: true
    }
  ];

  useEffect(() => {
    const checkRequirements = async () => {
      const results = await Promise.all(
        pwaRequirements.map(async (req) => ({
          ...req,
          status: await req.check()
        }))
      );
      setRequirements(results);
      setIsChecking(false);
    };

    checkRequirements();
  }, []);

  const criticalFailures = requirements.filter(r => r.critical && r.status === false);
  const allPassed = requirements.every(r => r.status === true);
  const canInstall = criticalFailures.length === 0;

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <Info className="h-4 w-4 text-gray-400" />;
    return status ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusColor = (status: boolean | null, critical: boolean) => {
    if (status === null) return 'bg-gray-100';
    if (status) return 'bg-green-100 border-green-200';
    return critical ? 'bg-red-100 border-red-200' : 'bg-yellow-100 border-yellow-200';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Teste de Requisitos PWA
          <Badge variant={canInstall ? 'default' : 'destructive'}>
            {canInstall ? 'PRONTO PARA INSTALAR' : 'NÃO PODE INSTALAR'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isChecking && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Verificando requisitos do PWA...
            </AlertDescription>
          </Alert>
        )}

        {!isChecking && criticalFailures.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Problemas críticos encontrados:</strong> O PWA não pode ser instalado até que estes problemas sejam resolvidos.
            </AlertDescription>
          </Alert>
        )}

        {!isChecking && allPassed && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Todos os requisitos atendidos!</strong> O PWA está pronto para instalação.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3">
          {requirements.map((req, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg ${getStatusColor(req.status, req.critical)}`}
            >
              <div className="flex items-start gap-3">
                {getStatusIcon(req.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{req.name}</span>
                    {req.critical && (
                      <Badge variant="outline" className="text-xs">CRÍTICO</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{req.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-2">Informações do Navegador:</h4>
          <div className="text-sm space-y-1 text-gray-600">
            <p><strong>URL:</strong> {window.location.href}</p>
            <p><strong>Protocolo:</strong> {window.location.protocol}</p>
            <p><strong>Hostname:</strong> {window.location.hostname}</p>
            <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 100)}...</p>
            <p><strong>Service Worker:</strong> {'serviceWorker' in navigator ? 'Suportado' : 'Não suportado'}</p>
            <p><strong>PWA Install:</strong> {'BeforeInstallPromptEvent' in window ? 'Suportado' : 'Não suportado'}</p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-2">Instruções para Chrome:</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside text-gray-600">
            <li>Abra o Chrome no celular</li>
            <li>Acesse: <code className="bg-gray-100 px-1 rounded">{window.location.href}</code></li>
            <li>Toque no menu (3 pontos) no canto superior direito</li>
            <li>Selecione "Adicionar à tela inicial" ou "Instalar app"</li>
            <li>Confirme a instalação</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
} 
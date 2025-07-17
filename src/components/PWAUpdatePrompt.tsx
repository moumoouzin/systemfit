import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Wifi, X } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export const PWAUpdatePrompt = () => {
  const { needRefresh, offlineReady, close } = usePWA();

  if (!needRefresh && !offlineReady) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {needRefresh ? (
                  <>
                    <RefreshCw className="h-5 w-5" />
                    Nova versão disponível
                  </>
                ) : (
                  <>
                    <Wifi className="h-5 w-5" />
                    App pronto para uso offline
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {needRefresh 
                  ? 'Uma nova versão do SystemFit está disponível'
                  : 'O SystemFit agora funciona offline'
                }
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={close}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            {needRefresh && (
              <Button
                onClick={() => window.location.reload()}
                className="flex-1"
                size="sm"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar
              </Button>
            )}
            <Button
              variant="outline"
              onClick={close}
              size="sm"
            >
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PWADebug } from "@/components/PWADebug";
import { PWATest } from "@/components/PWATest";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, LogOut, User, Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme, isDarkMode } = useTheme();

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>

      {/* Perfil do Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil
          </CardTitle>
          <CardDescription>
            Informações da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Nome:</span>
            <span className="text-sm text-gray-600">{user?.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Username:</span>
            <span className="text-sm text-gray-600">{user?.username}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">ID do Usuário:</span>
            <span className="text-sm text-gray-600 font-mono">{user?.id}</span>
          </div>
          <Separator />
          <Button variant="outline" onClick={handleSignOut} className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Sair da Conta
          </Button>
        </CardContent>
      </Card>

      {/* Tema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            Tema
          </CardTitle>
          <CardDescription>
            Escolha entre tema claro e escuro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm">Tema Atual:</span>
            <Badge variant="outline">
              {isDarkMode ? 'Escuro' : 'Claro'}
            </Badge>
          </div>
          <Button 
            onClick={toggleTheme} 
            variant="outline" 
            className="w-full mt-4"
          >
            {isDarkMode ? (
              <>
                <Sun className="h-4 w-4 mr-2" />
                Mudar para Tema Claro
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 mr-2" />
                Mudar para Tema Escuro
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Debug PWA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📱 PWA Debug
          </CardTitle>
          <CardDescription>
            Status e informações do Progressive Web App
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PWADebug />
        </CardContent>
      </Card>

      {/* Teste PWA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 Teste PWA
          </CardTitle>
          <CardDescription>
            Verificação detalhada dos requisitos para instalação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PWATest />
        </CardContent>
      </Card>
    </div>
  );
}

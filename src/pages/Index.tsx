
import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DumbbellIcon, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="p-6 border rounded-lg bg-card">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary">
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center border-2 border-white">
                {user.level || 1}
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-bold">{user.name || user.username}</h2>
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-sm text-muted-foreground">
                <span className="font-medium">XP: {user.xp || 0}</span>
                <span className="hidden md:block">•</span>
                <span>Nível: {user.level || 1}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Bem-vindo ao SystemFit</CardTitle>
                <CardDescription>
                  Sistema de treino com elementos de RPG
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Bem-vindo ao SystemFit! Este é o seu dashboard personalizado onde você pode acompanhar seu progresso de treino.
                Comece criando seu primeiro treino ou explorando as estatísticas.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => navigate('/workouts')}>
                  Ver treinos
                </Button>
                <Button variant="outline" onClick={() => navigate('/stats')}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Estatísticas
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle>Novo Treino</CardTitle>
              <CardDescription>
                Crie um novo treino personalizado
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center items-center space-y-4">
              <DumbbellIcon className="h-12 w-12 text-muted-foreground" />
              <Button 
                className="w-full" 
                onClick={() => navigate('/workouts/new')}
              >
                Criar Treino
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;

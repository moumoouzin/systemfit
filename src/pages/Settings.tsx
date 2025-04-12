
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Shield, Bell, User } from "lucide-react";

const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "O nome deve ter pelo menos 2 caracteres.",
    })
    .max(30, {
      message: "O nome deve ter no máximo 30 caracteres.",
    }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const Settings = () => {
  const { profile, updateProfile, logout } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile?.name || "",
    },
    values: {
      name: profile?.name || "",
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    try {
      setIsLoading(true);
      await updateProfile({
        name: data.name,
      });
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações de perfil foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar seu perfil.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logout();
      toast({
        title: "Sessão encerrada",
        description: "Você saiu da sua conta com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao sair:", error);
      toast({
        title: "Erro",
        description: "Não foi possível sair da sua conta.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências de conta e perfil.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Segurança</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>
                Gerencie as informações do seu perfil.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-8">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatarUrl} alt={profile?.name} />
                    <AvatarFallback>{profile?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-medium">Foto de perfil</h3>
                    <p className="text-sm text-muted-foreground">
                      Esta imagem será exibida em seu perfil.
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button variant="outline" size="sm" disabled>
                        Alterar
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu nome" {...field} />
                          </FormControl>
                          <FormDescription>
                            Este é seu nome de exibição no aplicativo.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Salvando..." : "Salvar alterações"}
                    </Button>
                  </form>
                </Form>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas RPG</CardTitle>
              <CardDescription>
                Informações sobre seu progresso no sistema de RPG.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">Nível</div>
                    <div className="text-2xl font-bold">{profile?.level || 1}</div>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">XP</div>
                    <div className="text-2xl font-bold">{profile?.xp || 0}</div>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">Treinos</div>
                    <div className="text-2xl font-bold">{profile?.daysTrainedThisWeek || 0}</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Atributos</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-sm text-muted-foreground">Força</div>
                      <div className="text-2xl font-bold text-rpg-strength">{profile?.attributes?.strength || 1}</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-sm text-muted-foreground">Vitalidade</div>
                      <div className="text-2xl font-bold text-rpg-vitality">{profile?.attributes?.vitality || 1}</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-sm text-muted-foreground">Foco</div>
                      <div className="text-2xl font-bold text-rpg-focus">{profile?.attributes?.focus || 1}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Configure como você deseja receber notificações.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">
                  As configurações de notificação estarão disponíveis em breve.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>
                Gerencie suas configurações de segurança.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Sessão</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Gerencie suas sessões ativas e encerre sua conta quando necessário.
                  </p>
                  <Button 
                    variant="destructive" 
                    onClick={handleLogout}
                    disabled={isLoading}
                  >
                    {isLoading ? "Saindo..." : "Sair da conta"}
                  </Button>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Senha</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Altere sua senha para manter sua conta segura.
                  </p>
                  <Button variant="outline" disabled>
                    Alterar senha
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;

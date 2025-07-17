
import { PropsWithChildren } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Dumbbell, History, LineChart, Settings } from "lucide-react";

const MainLayout = ({ children }: PropsWithChildren) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: location.pathname === "/dashboard"
    },
    {
      href: "/workouts",
      label: "Treinos",
      icon: Dumbbell,
      active: location.pathname === "/workouts"
    },
    {
      href: "/history",
      label: "Histórico",
      icon: History,
      active: location.pathname === "/history"
    },
    {
      href: "/stats",
      label: "Estatísticas",
      icon: LineChart,
      active: location.pathname === "/stats"
    },
    {
      href: "/settings",
      label: "Configurações",
      icon: Settings,
      active: location.pathname === "/settings"
    },
  ];

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar 
          side="left"
          variant="floating" 
          className="border-none shadow-none md:border-r md:shadow-sm"
        >
          <SidebarHeader className="px-4 mb-2">
            <div className="text-2xl font-bold">SystemFit</div>
            <p className="text-sm text-muted-foreground">Fitness RPG</p>
          </SidebarHeader>
          
          {user && (
            <div className="px-4 mb-6 flex items-center gap-2">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                <span className="text-primary font-medium">
                  {user.name?.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name || user.username}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} title="Sair">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
          
          <SidebarContent>
            <SidebarMenu>
              {routes.map((route) => (
                <SidebarMenuItem key={route.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={route.active}
                    tooltip={route.label}
                  >
                    <Link to={route.href} className="gap-2">
                      <route.icon className="h-5 w-5" />
                      <span>{route.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        
        <SidebarInset className="pt-6 pb-16 md:pb-6">
          <div className="px-4 md:px-6 max-w-4xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
              <SidebarTrigger>
                <Menu className="h-6 w-6" />
              </SidebarTrigger>
            </div>
            {children}
          </div>
        </SidebarInset>
      </div>
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
    </SidebarProvider>
  );
};

export default MainLayout;

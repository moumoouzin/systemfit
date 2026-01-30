
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
import { useIsMobile } from "@/hooks/use-mobile";
import BottomNavigation from "@/components/BottomNavigation";
import { FitChat } from "@/components/FitChat";

const MainLayout = ({ children }: PropsWithChildren) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

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
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full bg-background">
        {/* Sidebar - apenas para desktop */}
        {!isMobile && (
          <Sidebar 
            side="left"
            variant="floating"
            className="border-none shadow-none md:border-r md:shadow-sm"
            collapsible="icon"
          >
            <SidebarHeader className="px-4 mb-2">
              <div className="text-xl md:text-2xl font-bold">SystemFit</div>
              <p className="text-xs md:text-sm text-muted-foreground">Fitness RPG</p>
            </SidebarHeader>
            
            {user && (
              <div className="px-4 mb-4 md:mb-6 flex items-center gap-2">
                <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  <span className="text-primary font-medium text-sm md:text-base">
                    {user.name?.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium truncate">{user.name || user.username}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={logout} title="Sair">
                  <LogOut className="h-4 w-4 md:h-5 md:w-5" />
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
                      size="default"
                    >
                      <Link to={route.href} className="gap-2">
                        <route.icon className="h-4 w-4 md:h-5 md:w-5" />
                        <span className="text-sm md:text-base">{route.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
        )}
        
        {/* Conteúdo principal */}
        <div className={`flex-1 ${isMobile ? 'pt-4 pb-20' : 'pt-6 pb-16 md:pb-6'}`}>
          <div className={`px-3 md:px-6 ${isMobile ? 'max-w-full overflow-x-hidden' : 'max-w-4xl mx-auto'}`}>
            {/* Header mobile com perfil e logout */}
            {isMobile && (
              <div className="mb-4 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium text-sm">
                      {user?.name?.charAt(0).toUpperCase() || user?.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user?.name || user?.username}</p>
                    <p className="text-xs text-muted-foreground">SystemFit</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={logout} title="Sair">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Header desktop com sidebar trigger */}
            {!isMobile && (
              <div className="mb-4 md:mb-6 flex items-center gap-2 md:gap-4">
                <SidebarTrigger>
                  <Menu className="h-5 w-5 md:h-6 md:w-6" />
                </SidebarTrigger>
              </div>
            )}
            
            <div className={`${isMobile ? 'space-y-4' : ''} w-full max-w-full overflow-x-hidden`}>
              {children}
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation - apenas para mobile */}
      {isMobile && <BottomNavigation />}
      
      <FitChat />
      
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
    </SidebarProvider>
  );
};

export default MainLayout;

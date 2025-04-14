
import { PropsWithChildren } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton, 
  SidebarInset,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Dumbbell, History, LineChart, Settings } from "lucide-react";

const MainLayout = ({ children }: PropsWithChildren) => {
  const { profile, logout } = useAuth();
  const location = useLocation();

  const routes = [
    {
      href: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: location.pathname === "/"
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
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <Sidebar side="left">
          <SidebarHeader className="px-4 mb-2">
            <div className="text-2xl font-bold">SystemFit</div>
            <p className="text-sm text-muted-foreground">Fitness RPG</p>
          </SidebarHeader>
          
          {profile && (
            <div className="px-4 mb-6 flex items-center gap-2">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-primary font-medium">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile.name}</p>
                <p className="text-xs text-muted-foreground truncate">Nível {profile.level}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} title="Sair">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
          
          <SidebarContent className="px-2">
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
          <main className="px-4 md:px-6 max-w-4xl mx-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;

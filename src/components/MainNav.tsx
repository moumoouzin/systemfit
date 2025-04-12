
import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Dumbbell, 
  History, 
  LineChart,
  Settings, 
  Plus 
} from "lucide-react";

export function MainNav() {
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t py-2 px-4 md:relative md:border-t-0 md:bg-transparent md:px-0 md:py-0">
      <div className="flex justify-between items-center md:flex-col md:items-start md:space-y-1">
        {routes.map((route) => (
          <Link
            key={route.href}
            to={route.href}
            className={cn(
              "flex items-center text-sm md:w-full md:px-3 md:py-2 rounded-md",
              "transition-colors hover:text-primary hover:bg-muted/50",
              route.active 
                ? "text-primary font-medium bg-muted" 
                : "text-muted-foreground"
            )}
          >
            <route.icon className="h-5 w-5 md:mr-2" />
            <span className="hidden md:inline">{route.label}</span>
          </Link>
        ))}
        
        {/* Mobile add workout button */}
        <Link
          to="/workouts/new"
          className="flex items-center justify-center bg-primary text-primary-foreground rounded-full h-10 w-10 md:hidden"
        >
          <Plus className="h-5 w-5" />
        </Link>
      </div>
    </nav>
  );
}

export default MainNav;

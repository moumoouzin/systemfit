import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Dumbbell, History, LineChart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const BottomNavigation = () => {
  const location = useLocation();

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/workouts",
      label: "Treinos",
      icon: Dumbbell,
    },
    {
      href: "/history",
      label: "Histórico",
      icon: History,
    },
    {
      href: "/stats",
      label: "Estatísticas",
      icon: LineChart,
    },
    {
      href: "/settings",
      label: "Configurações",
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 md:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {routes.map((route) => {
          const isActive = location.pathname === route.href;
          const Icon = route.icon;
          
          return (
            <Link
              key={route.href}
              to={route.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-0 flex-1",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium truncate max-w-full">
                {route.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;

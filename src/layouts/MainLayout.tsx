
import { PropsWithChildren } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import MainNav from "@/components/MainNav";

const MainLayout = ({ children }: PropsWithChildren) => {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="hidden md:flex md:w-64 md:flex-col md:border-r md:py-6">
        <div className="px-4 mb-6">
          <h1 className="text-2xl font-bold tracking-tight">SystemFit</h1>
          <p className="text-sm text-muted-foreground">Fitness RPG</p>
        </div>
        
        {user && (
          <div className="px-4 mb-6 flex items-center gap-2">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-primary font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">Nível {user.level}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} title="Sair">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
        
        <MainNav />
      </div>
      <div className="flex-1 md:py-6 pb-16 md:pb-6">
        <main className="px-4 md:px-6 max-w-4xl mx-auto">
          {children}
        </main>
      </div>
      <div className="md:hidden block">
        <MainNav />
      </div>
    </div>
  );
};

export default MainLayout;

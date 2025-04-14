
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth/AuthContext";
import { Loader } from "lucide-react";
import MainLayout from "@/layouts/MainLayout";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Console log para debugging
  useEffect(() => {
    console.log("ProtectedRoute - Auth state:", { 
      user: user?.id, 
      isLoading, 
      path: location.pathname 
    });
  }, [user, isLoading, location]);

  // Se ainda estiver carregando, mostre o indicador de carregamento
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-12 w-12 text-primary animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não houver usuário, redirecione para login
  if (!user) {
    console.log("No user found, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se houver um usuário, renderize o conteúdo protegido com o layout
  console.log("User found, rendering content");
  return <MainLayout>{children}</MainLayout>;
};

export default ProtectedRoute;

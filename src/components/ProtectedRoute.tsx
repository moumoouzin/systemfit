
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/layouts/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [timeoutExpired, setTimeoutExpired] = useState(false);

  // Add a 3-second timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutExpired(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Console log for debugging
  console.log("ProtectedRoute - Auth state:", { user, isLoading, timeoutExpired });

  // Se ainda estiver carregando e o timeout não expirou, mostre o indicador de carregamento
  if (isLoading && !timeoutExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se o timeout expirou ou não há usuário, redirecione para o login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se houver um usuário, renderize o conteúdo protegido
  return <MainLayout>{children}</MainLayout>;
};

export default ProtectedRoute;

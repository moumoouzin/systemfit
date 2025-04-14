
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth/AuthContext";
import MainLayout from "@/layouts/MainLayout";
import { Loader } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Console log for debugging
  useEffect(() => {
    console.log("ProtectedRoute - Auth state:", { 
      user: user?.id, 
      isLoading, 
      path: location.pathname 
    });
  }, [user, isLoading, location]);

  // If still loading, show loading indicator
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

  // If there's no user, redirect to login
  if (!user) {
    console.log("No user found, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If there's a user, render the protected content
  console.log("User found, rendering content");
  return <MainLayout>{children}</MainLayout>;
};

export default ProtectedRoute;

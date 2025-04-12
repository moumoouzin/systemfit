
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

  // If still loading and timeout hasn't expired, show loading indicator
  if (isLoading && !timeoutExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If timeout expired or there's no user, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If there's a user, render the protected content
  return <MainLayout>{children}</MainLayout>;
};

export default ProtectedRoute;

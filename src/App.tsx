
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedLayout from "@/layouts/ProtectedLayout";
import { PWABackgroundManager } from "@/components/PWABackgroundManager";
import { useConnectionManager } from "@/hooks/useConnectionManager";
import { useAppStateManager } from "@/hooks/useAppStateManager";
import { useDebugLogger } from "@/hooks/useDebugLogger";

// Componente interno para usar debug logger dentro do Router
const AppContent = () => {
  // useDebugLogger();
  
  return (
    <AuthProvider>
      <PWABackgroundManager>
        <Routes>
          {/* Login and Register routes - now properly wrapped in AuthProvider */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Protected routes wrapped in ProtectedLayout for persistence */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/workouts/new" element={<NewWorkout />} />
            <Route path="/workouts/edit/:id" element={<EditWorkout />} />
            <Route path="/workouts/import" element={<WorkoutImport />} />
            <Route path="/workout/:id" element={<WorkoutDetail />} />
            <Route path="/history" element={<History />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
        <Sonner />
      </PWABackgroundManager>
    </AuthProvider>
  );
};
import Dashboard from "./pages/Index";
import Workouts from "./pages/Workouts";
import NewWorkout from "./pages/NewWorkout";
import EditWorkout from "./pages/EditWorkout";
import WorkoutImport from "./pages/WorkoutImport";
import WorkoutDetail from "./pages/WorkoutDetail";
import History from "./pages/History";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "./contexts/ThemeContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    }
  }
});

const App = () => {
  // Inicializar gerenciadores
  useConnectionManager();
  useAppStateManager();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

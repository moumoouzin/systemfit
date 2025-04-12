
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold mb-4 text-primary">404</h1>
        <p className="text-xl text-foreground mb-6">
          Oops! A página que você está procurando não existe.
        </p>
        <p className="text-muted-foreground mb-8">
          Parece que você perdeu seu caminho durante o treino. 
          Vamos voltar para a página inicial!
        </p>
        <Button onClick={() => navigate("/")} size="lg">
          <Home className="mr-2 h-5 w-5" />
          Voltar ao Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;

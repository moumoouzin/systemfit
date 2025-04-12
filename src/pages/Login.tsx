
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, LogIn, Mail, Eye, EyeOff, Lock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, loginWithGoogle, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsSubmitting(true);
    try {
      await login(email, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsSubmitting(true);
    loginWithGoogle();
  };

  // Determinar se o botão deve mostrar o estado de carregamento
  const buttonLoading = isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <Dumbbell className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">SystemFit</h1>
          <p className="text-muted-foreground">Seu aplicativo de treino com RPG</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entrar na sua conta</CardTitle>
            <CardDescription>
              Digite seu email e senha para acessar o sistema
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={buttonLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={buttonLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    disabled={buttonLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={buttonLoading}
              >
                {buttonLoading ? (
                  <>
                    <span className="animate-pulse">Entrando...</span>
                  </>
                ) : (
                  <>
                    Entrar
                    <LogIn className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              
              <div className="flex items-center gap-2 w-full">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">OU</span>
                <Separator className="flex-1" />
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={buttonLoading}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" aria-hidden="true">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="currentColor"/>
                </svg>
                Continuar com Google
              </Button>
              
              <p className="text-center text-sm text-muted-foreground">
                Não tem uma conta?{" "}
                <Link
                  to="/register"
                  className="underline text-primary hover:text-primary/80"
                >
                  Criar conta
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;

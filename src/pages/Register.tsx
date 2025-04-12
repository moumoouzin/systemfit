
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, LogIn, Mail, Eye, EyeOff, Lock, User, Upload, Shield, Zap, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/use-toast";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [attributes, setAttributes] = useState({
    strength: 1,
    vitality: 1,
    focus: 1,
  });
  const [attributePoints, setAttributePoints] = useState(3);
  const { register, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!name || !email || !password || !confirmPassword) {
      setError("Preencha todos os campos");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }
    
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (step === 1) {
      setStep(2);
      return;
    }

    try {
      // Upload avatar if exists
      let avatarUrl = null;
      if (avatar) {
        const fileExt = avatar.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatar);

        if (uploadError) {
          throw uploadError;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
          
        avatarUrl = publicUrl;
      }
      
      // Register user with additional data
      await register(email, password, name, {
        avatarUrl,
        attributes
      });
    } catch (error: any) {
      console.error("Erro ao registrar:", error);
      setError(error.message || "Erro ao criar conta");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      
      // Preview image
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateAttribute = (attribute: keyof typeof attributes, value: number[]) => {
    const newValue = value[0];
    const oldValue = attributes[attribute];
    const diff = newValue - oldValue;
    
    if (attributePoints - diff < 0) {
      toast({
        title: "Pontos insuficientes",
        description: "Você não tem pontos suficientes para aumentar este atributo",
        variant: "destructive"
      });
      return;
    }
    
    setAttributes(prev => ({
      ...prev,
      [attribute]: newValue
    }));
    
    setAttributePoints(prev => prev - diff);
  };

  const renderStep1 = () => (
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="name"
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
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
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
      {error && (
        <div className="text-destructive text-sm">{error}</div>
      )}
    </CardContent>
  );

  const renderStep2 = () => (
    <CardContent className="space-y-4">
      <div className="flex flex-col items-center gap-4 mb-2">
        <Label htmlFor="avatar">Foto do personagem</Label>
        <div className="relative">
          <Avatar className="w-24 h-24 border-4 border-primary animate-pulse-glow">
            <AvatarImage src={avatarPreview || undefined} alt={name} />
            <AvatarFallback className="bg-muted">
              {name ? name.charAt(0).toUpperCase() : "A"}
            </AvatarFallback>
          </Avatar>
          <label 
            htmlFor="avatar" 
            className="absolute bottom-0 right-0 p-1 bg-primary text-white rounded-full cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <input 
              id="avatar" 
              type="file" 
              onChange={handleFileChange}
              className="hidden" 
              accept="image/*"
            />
          </label>
        </div>
      </div>

      <div className="space-y-4 mt-6">
        <div className="text-center">
          <h3 className="font-bold text-lg">Atributos do personagem</h3>
          <p className="text-sm text-muted-foreground">Pontos disponíveis: {attributePoints}</p>
        </div>

        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rpg-strength">
                <Shield size={18} />
                <Label htmlFor="strength">Força</Label>
              </div>
              <span className="font-bold">{attributes.strength}</span>
            </div>
            <Slider 
              id="strength"
              value={[attributes.strength]} 
              min={1} 
              max={5} 
              step={1} 
              onValueChange={(value) => updateAttribute('strength', value)} 
              className="bg-rpg-strength/20"
            />
            <Progress value={(attributes.strength/5) * 100} className="h-2 bg-rpg-strength/20" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rpg-vitality">
                <Zap size={18} />
                <Label htmlFor="vitality">Vigor</Label>
              </div>
              <span className="font-bold">{attributes.vitality}</span>
            </div>
            <Slider 
              id="vitality"
              value={[attributes.vitality]} 
              min={1} 
              max={5} 
              step={1} 
              onValueChange={(value) => updateAttribute('vitality', value)} 
              className="bg-rpg-vitality/20"
            />
            <Progress value={(attributes.vitality/5) * 100} className="h-2 bg-rpg-vitality/20" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rpg-focus">
                <Brain size={18} />
                <Label htmlFor="focus">Foco</Label>
              </div>
              <span className="font-bold">{attributes.focus}</span>
            </div>
            <Slider 
              id="focus"
              value={[attributes.focus]} 
              min={1} 
              max={5} 
              step={1} 
              onValueChange={(value) => updateAttribute('focus', value)} 
              className="bg-rpg-focus/20"
            />
            <Progress value={(attributes.focus/5) * 100} className="h-2 bg-rpg-focus/20" />
          </div>
        </div>
      </div>

      {error && (
        <div className="text-destructive text-sm">{error}</div>
      )}
    </CardContent>
  );

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
            <CardTitle>{step === 1 ? "Criar nova conta" : "Criar personagem"}</CardTitle>
            <CardDescription>
              {step === 1 
                ? "Preencha os dados abaixo para se registrar" 
                : "Personalize seu personagem para a jornada"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            {step === 1 ? renderStep1() : renderStep2()}
            <CardFooter className="flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading 
                  ? "Registrando..." 
                  : step === 1 
                    ? "Próximo passo" 
                    : "Criar conta"}
                <LogIn className="ml-2 h-4 w-4" />
              </Button>
              {step === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep(1)}
                >
                  Voltar
                </Button>
              )}
              <p className="text-center text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link
                  to="/login"
                  className="underline text-primary hover:text-primary/80"
                >
                  Fazer login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;

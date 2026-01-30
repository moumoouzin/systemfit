
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, X, Bot, Loader2, Settings, ArrowLeft, Save } from "lucide-react";
import { useFitAI } from "@/hooks/useFitAI";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function FitChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const { messages, processMessage, isProcessing, config, updateConfig } = useFitAI();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Estados locais para edição de config
  const [tempApiKey, setTempApiKey] = useState(config.apiKey);
  const [tempModel, setTempModel] = useState(config.model);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, showSettings]);

  // Sincronizar quando abrir
  useEffect(() => {
    if (showSettings) {
      setTempApiKey(config.apiKey);
      setTempModel(config.model);
    }
  }, [showSettings, config]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    if (!config.apiKey) {
      setShowSettings(true);
      return;
    }

    const msg = inputValue;
    setInputValue("");
    await processMessage(msg);
  };

  const handleSaveConfig = () => {
    updateConfig({ apiKey: tempApiKey, model: tempModel });
    setShowSettings(false);
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end sm:bottom-4">
      {isOpen && (
        <Card className="mb-4 h-[500px] w-[350px] shadow-xl border-primary/20 animate-in fade-in slide-in-from-bottom-10 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-primary/5 rounded-t-lg shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-bold">FitChat AI</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              {!showSettings ? (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => setShowSettings(true)}
                  title="Configurações"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => setShowSettings(false)}
                  title="Voltar ao Chat"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex flex-col h-full overflow-hidden">
            {showSettings ? (
              <div className="p-4 flex flex-col gap-4 h-full">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Configurações AI</h3>
                  <p className="text-xs text-muted-foreground">
                    Configure sua conexão com OpenRouter para usar a inteligência artificial.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="apiKey">OpenRouter API Key</Label>
                    <Input 
                      id="apiKey"
                      type="password"
                      placeholder="sk-or-..."
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="model">Modelo</Label>
                    <Input 
                      id="model"
                      placeholder="openai/gpt-4o-mini"
                      value={tempModel}
                      onChange={(e) => setTempModel(e.target.value)}
                    />
                    <p className="text-[10px] text-muted-foreground">Ex: anthropic/claude-3-haiku, google/gemini-flash-1.5</p>
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <Button className="w-full gap-2" onClick={handleSaveConfig}>
                    <Save className="h-4 w-4" /> Salvar
                  </Button>
                  <div className="mt-2 text-center">
                    <a 
                      href="https://openrouter.ai/keys" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Obter chave no OpenRouter
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1 p-4">
                  <div className="flex flex-col gap-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                          msg.role === "user"
                            ? "ml-auto bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {msg.content}
                      </div>
                    ))}
                    {isProcessing && (
                      <div className="flex w-max max-w-[80%] items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Processando...
                      </div>
                    )}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>
                
                {!config.apiKey && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 text-xs text-center text-yellow-600 dark:text-yellow-400 border-t border-yellow-200 dark:border-yellow-900">
                    ⚠️ API Key não configurada. Clique na engrenagem.
                  </div>
                )}

                <div className="p-4 border-t mt-auto bg-background">
                  <form
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-2"
                  >
                    <Input
                      placeholder={config.apiKey ? "Digite seu comando..." : "Configure a API Key primeiro"}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="flex-1"
                      disabled={!config.apiKey && !inputValue} // Permitir digitar para testar UX, mas bloquear envio se vazio
                    />
                    <Button type="submit" size="icon" disabled={isProcessing || (!config.apiKey && !inputValue)}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className="h-14 w-14 rounded-full shadow-lg p-0 hover:scale-105 transition-transform"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-8 w-8" />
        )}
      </Button>
    </div>
  );
}

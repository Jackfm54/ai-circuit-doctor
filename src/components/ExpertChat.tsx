import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Bot, User, Loader2, Sparkles, ImagePlus, X, CircuitBoard, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import ReactMarkdown from "react-markdown";
import { aiResponseError } from "@/lib/aiResponse";

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
  diagram?: string;
}

export function ExpertChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t, language } = useLanguage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeImage = useCallback(() => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const generateDiagram = async () => {
    if (!selectedImage || isGeneratingDiagram) return;

    const imageToAnalyze = selectedImage;
    setIsGeneratingDiagram(true);

    const userMessage: Message = {
      role: "user",
      content: t.expertChat.generateDiagramRequest,
      image: imageToAnalyze,
    };
    setMessages((prev) => [...prev, userMessage]);
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/expert-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: "", image: imageToAnalyze }],
            language,
            mode: "generate_diagram",
          }),
        }
      );

      const serviceError = await aiResponseError(response, language, t.expertChat.errorMessage);
      if (serviceError) {
        toast({ title: t.expertChat.error, description: serviceError, variant: "destructive" });
        setSelectedImage(imageToAnalyze);
        return;
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.description || t.expertChat.diagramGenerated,
        diagram: data.diagram || undefined,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Diagram generation error:", error);
      toast({
        title: t.expertChat.error,
        description: error instanceof Error ? error.message : t.expertChat.errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDiagram(false);
    }
  };

  const downloadDiagram = (dataUrl: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `circuit-diagram-${Date.now()}.png`;
    link.click();
  };

  const sendMessage = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim() || (selectedImage ? "Analysez cette image" : ""),
      image: selectedImage || undefined,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/expert-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
              image: m.image,
            })),
            language,
          }),
        }
      );

      const serviceError = await aiResponseError(response, language, t.expertChat.errorMessage);
      if (serviceError) {
        toast({ title: t.expertChat.error, description: serviceError, variant: "destructive" });
        setInput(userMessage.content);
        setSelectedImage(userMessage.image ?? null);
        setMessages((prev) => prev.filter((message) => message !== userMessage));
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      if (reader) {
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") continue;

              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  assistantContent += content;
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      role: "assistant",
                      content: assistantContent,
                    };
                    return newMessages;
                  });
                }
              } catch {
                // Ignore parsing errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: t.expertChat.error,
        description: error instanceof Error ? error.message : t.expertChat.errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isBusy = isLoading || isGeneratingDiagram;

  return (
    <Card className="border-primary/30 bg-card/50 backdrop-blur-sm h-[500px] flex flex-col">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-primary/20">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          {t.expertChat.title}
          <Sparkles className="w-4 h-4 text-primary ml-auto" />
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto text-primary/50 mb-4" />
                <p className="text-muted-foreground text-sm">
                  {t.expertChat.greeting}
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  {t.expertChat.capabilities.map((cap, idx) => (
                    <li key={idx}>• {cap}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">
                  {t.expertChat.suggestedQuestions}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {t.expertChat.questions.map((question, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-2 px-3 text-left justify-start"
                      onClick={() => setInput(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`p-2 rounded-full shrink-0 ${
                      message.role === "user"
                        ? "bg-primary/20"
                        : "bg-success/20"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-primary" />
                    ) : (
                      <Bot className="w-4 h-4 text-success" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.role === "user"
                        ? "bg-primary/20 text-foreground"
                        : "bg-muted/50"
                    }`}
                  >
                    {message.image && (
                      <img
                        src={message.image}
                        alt="User uploaded"
                        className="max-w-full max-h-48 rounded-lg mb-2 object-contain"
                      />
                    )}
                    {message.diagram && (
                      <div className="space-y-2 mb-2">
                        <img
                          src={message.diagram}
                          alt="Generated schematic diagram"
                          className="max-w-full rounded-lg border border-border object-contain bg-white"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1"
                          onClick={() => downloadDiagram(message.diagram!)}
                        >
                          <Download className="w-3 h-3" />
                          {t.expertChat.downloadDiagram}
                        </Button>
                      </div>
                    )}
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      message.content && (
                        <p className="text-sm">{message.content}</p>
                      )
                    )}
                  </div>
                </div>
              ))}
              {isGeneratingDiagram && (
                <div className="flex gap-3">
                  <div className="p-2 rounded-full bg-success/20">
                    <Bot className="w-4 h-4 text-success" />
                  </div>
                  <div className="rounded-lg px-4 py-3 bg-muted/50 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {t.expertChat.generatingDiagram}
                    </span>
                  </div>
                </div>
              )}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3">
                  <div className="p-2 rounded-full bg-success/20">
                    <Bot className="w-4 h-4 text-success" />
                  </div>
                  <div className="rounded-lg px-4 py-2 bg-muted/50">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
          {selectedImage && (
            <div className="flex items-start gap-2">
              <div className="relative inline-block">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="max-h-24 rounded-lg object-contain border border-border"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                  title={t.expertChat.removeImage}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <Button
                variant="tech"
                size="sm"
                className="text-xs gap-1 shrink-0"
                onClick={generateDiagram}
                disabled={isBusy}
              >
                {isGeneratingDiagram ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CircuitBoard className="w-3 h-3" />
                )}
                {t.expertChat.generateDiagram}
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              title={t.expertChat.addImage}
              className="shrink-0"
            >
              <ImagePlus className="w-4 h-4" />
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.expertChat.placeholder}
              className="min-h-[44px] max-h-[120px] resize-none bg-background/50"
              disabled={isBusy}
            />
            <Button
              onClick={sendMessage}
              disabled={(!input.trim() && !selectedImage) || isBusy}
              variant="techGlow"
              size="icon"
              className="shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

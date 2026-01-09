import { useState } from "react";
import { Header } from "@/components/Header";
import { ImageUploader } from "@/components/ImageUploader";
import { DiagnosticResult, DiagnosticData } from "@/components/DiagnosticResult";
import { Button } from "@/components/ui/button";
import { RotateCcw, Cpu, Zap, Shield, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Index() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticData | null>(null);
  const { toast } = useToast();

  const handleImageAnalysis = async (file: File, preview: string) => {
    setIsAnalyzing(true);
    setDiagnosticResult(null);

    try {
      // Convert image to base64 for the API
      const base64Image = preview.split(",")[1];

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-circuit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ image: base64Image }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al analizar la imagen");
      }

      const result = await response.json();
      setDiagnosticResult(result);
      
      toast({
        title: "Análisis completado",
        description: "El diagnóstico de la tarjeta ha finalizado.",
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Error en el análisis",
        description: error instanceof Error ? error.message : "No se pudo analizar la imagen",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setDiagnosticResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Tech grid background */}
      <div className="fixed inset-0 tech-grid opacity-30 pointer-events-none" />
      <div 
        className="fixed inset-0 pointer-events-none opacity-50"
        style={{ background: "var(--gradient-glow)" }}
      />

      <main className="relative container mx-auto px-4 py-12">
        {!diagnosticResult ? (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-mono">
                <Cpu className="w-4 h-4" />
                Sistema de Diagnóstico Inteligente
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Detecta fallas en
                <span className="text-primary glow-text block mt-2">tarjetas electrónicas</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Sube una imagen de tu placa y nuestro modelo de IA identificará 
                componentes dañados con precisión.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                { icon: Zap, label: "Análisis rápido", desc: "Resultados en segundos" },
                { icon: Shield, label: "IA avanzada", desc: "Modelo entrenado" },
                { icon: Clock, label: "Historial", desc: "Guarda diagnósticos" },
              ].map((feature, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{feature.label}</div>
                    <div className="text-xs text-muted-foreground">{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Upload Zone */}
            <ImageUploader onImageSelect={handleImageAnalysis} isAnalyzing={isAnalyzing} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Diagnóstico Completo</h2>
              <Button onClick={handleReset} variant="tech">
                <RotateCcw className="w-4 h-4" />
                Nuevo análisis
              </Button>
            </div>
            <DiagnosticResult data={diagnosticResult} />
          </div>
        )}
      </main>
    </div>
  );
}

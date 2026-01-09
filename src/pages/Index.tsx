import { useState } from "react";
import { Header } from "@/components/Header";
import { ImageUploader } from "@/components/ImageUploader";
import { DiagnosticResult, DiagnosticData } from "@/components/DiagnosticResult";
import { SerialConnection } from "@/components/SerialConnection";
import { HardwareGuide } from "@/components/HardwareGuide";
import { MeasurementData } from "@/hooks/useSerialConnection";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCcw, Cpu, Zap, Shield, Clock, Camera, Usb, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Index() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticData | null>(null);
  const [hardwareMeasurements, setHardwareMeasurements] = useState<MeasurementData[]>([]);
  const [analyzedImageUrl, setAnalyzedImageUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageAnalysis = async (file: File, preview: string) => {
    setIsAnalyzing(true);
    setDiagnosticResult(null);
    setAnalyzedImageUrl(preview);

    try {
      const base64Image = preview.split(",")[1];

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-circuit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            image: base64Image,
            measurements: hardwareMeasurements.length > 0 ? hardwareMeasurements : undefined
          }),
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
        description: hardwareMeasurements.length > 0 
          ? "Diagnóstico combinado (imagen + hardware) finalizado."
          : "El diagnóstico de la tarjeta ha finalizado.",
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

  const handleHardwareOnlyAnalysis = async () => {
    if (hardwareMeasurements.length === 0) {
      toast({
        title: "Sin mediciones",
        description: "Realiza un escaneo de hardware primero para obtener mediciones.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setDiagnosticResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-circuit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            measurements: hardwareMeasurements
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al analizar las mediciones");
      }

      const result = await response.json();
      setDiagnosticResult(result);
      
      toast({
        title: "Análisis completado",
        description: "Diagnóstico basado en mediciones de hardware finalizado.",
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Error en el análisis",
        description: error instanceof Error ? error.message : "No se pudo analizar las mediciones",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMeasurementsReady = (measurements: MeasurementData[]) => {
    setHardwareMeasurements(measurements);
    toast({
      title: "Mediciones capturadas",
      description: `Se registraron ${measurements.length} mediciones. Puedes analizarlas ahora.`,
    });
  };

  const handleReset = () => {
    setDiagnosticResult(null);
    setHardwareMeasurements([]);
    setAnalyzedImageUrl(null);
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
                Conecta tu hardware de diagnóstico o sube una imagen para que la IA 
                identifique componentes dañados con precisión.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                { icon: Zap, label: "Análisis rápido", desc: "Resultados en segundos" },
                { icon: Shield, label: "IA avanzada", desc: "Modelo entrenado" },
                { icon: Clock, label: "Tiempo real", desc: "Mediciones en vivo" },
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

            {/* Main Content Tabs */}
            <Tabs defaultValue="hardware" className="max-w-4xl mx-auto">
              <TabsList className="grid grid-cols-3 w-full bg-card/50 border border-border/50">
                <TabsTrigger value="hardware" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <Usb className="w-4 h-4 mr-2" />
                  Conexión Hardware
                </TabsTrigger>
                <TabsTrigger value="image" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <Camera className="w-4 h-4 mr-2" />
                  Análisis de Imagen
                </TabsTrigger>
                <TabsTrigger value="guide" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Guía Hardware
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hardware" className="mt-6 space-y-6">
                <SerialConnection onMeasurementsReady={handleMeasurementsReady} />
                
                {hardwareMeasurements.length > 0 && (
                  <div className="flex justify-center gap-4">
                    <Button 
                      onClick={handleHardwareOnlyAnalysis} 
                      variant="techGlow"
                      disabled={isAnalyzing}
                      size="lg"
                    >
                      {isAnalyzing ? (
                        <>
                          <Cpu className="w-4 h-4 mr-2 animate-spin" />
                          Analizando...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Analizar con IA ({hardwareMeasurements.length} mediciones)
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <div className="text-center text-sm text-muted-foreground">
                  <p>
                    Conecta tu Arduino/ESP32 para realizar mediciones físicas.
                    {hardwareMeasurements.length > 0 && (
                      <span className="text-primary ml-1">
                        También puedes combinar con análisis de imagen.
                      </span>
                    )}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="image" className="mt-6">
                <div className="space-y-4">
                  {hardwareMeasurements.length > 0 && (
                    <div className="p-4 rounded-lg bg-success/10 border border-success/30 text-center">
                      <p className="text-sm text-success">
                        ✓ {hardwareMeasurements.length} mediciones de hardware listas para combinar con el análisis visual
                      </p>
                    </div>
                  )}
                  <ImageUploader onImageSelect={handleImageAnalysis} isAnalyzing={isAnalyzing} />
                </div>
              </TabsContent>

              <TabsContent value="guide" className="mt-6">
                <HardwareGuide />
              </TabsContent>
            </Tabs>
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
            <DiagnosticResult data={diagnosticResult} imageUrl={analyzedImageUrl || undefined} />
          </div>
        )}
      </main>
    </div>
  );
}

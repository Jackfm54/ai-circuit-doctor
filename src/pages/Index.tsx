import { useState } from "react";
import { Header } from "@/components/Header";
import { ImageUploader } from "@/components/ImageUploader";
import { DiagnosticResult, DiagnosticData } from "@/components/DiagnosticResult";
import { SerialConnection } from "@/components/SerialConnection";
import { HardwareGuide } from "@/components/HardwareGuide";
import { MeasurementData } from "@/hooks/useSerialConnection";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCcw, Cpu, Zap, Shield, Clock, Camera, Usb, BookOpen, MessageCircle } from "lucide-react";
import { ExpertChat } from "@/components/ExpertChat";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Index() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticData | null>(null);
  const [hardwareMeasurements, setHardwareMeasurements] = useState<MeasurementData[]>([]);
  const [analyzedImageUrl, setAnalyzedImageUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { t, language } = useLanguage();

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
            measurements: hardwareMeasurements.length > 0 ? hardwareMeasurements : undefined,
            language
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.toasts.analysisErrorDesc);
      }

      const result = await response.json();
      setDiagnosticResult(result);
      
      toast({
        title: t.toasts.analysisComplete,
        description: hardwareMeasurements.length > 0 
          ? t.toasts.combinedAnalysisDesc
          : t.toasts.analysisCompleteDesc,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: t.toasts.analysisError,
        description: error instanceof Error ? error.message : t.toasts.analysisErrorDesc,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleHardwareOnlyAnalysis = async () => {
    if (hardwareMeasurements.length === 0) {
      toast({
        title: t.hardware.noMeasurements,
        description: t.hardware.noMeasurementsDesc,
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
            measurements: hardwareMeasurements,
            language
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.toasts.analysisErrorDesc);
      }

      const result = await response.json();
      setDiagnosticResult(result);
      
      toast({
        title: t.toasts.analysisComplete,
        description: t.toasts.hardwareAnalysisDesc,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: t.toasts.analysisError,
        description: error instanceof Error ? error.message : t.toasts.analysisErrorDesc,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMeasurementsReady = (measurements: MeasurementData[]) => {
    setHardwareMeasurements(measurements);
    toast({
      title: t.toasts.measurementsCaptured,
      description: `${measurements.length} ${t.toasts.measurementsCapturedDesc}`,
    });
  };

  const handleReset = () => {
    setDiagnosticResult(null);
    setHardwareMeasurements([]);
    setAnalyzedImageUrl(null);
  };

  const features = [
    { icon: Zap, label: t.features.fastAnalysis, desc: t.features.fastAnalysisDesc },
    { icon: Shield, label: t.features.advancedAI, desc: t.features.advancedAIDesc },
    { icon: Clock, label: t.features.realTime, desc: t.features.realTimeDesc },
  ];

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
                {t.hero.badge}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                {t.hero.title}
                <span className="text-primary glow-text block mt-2">{t.hero.titleHighlight}</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                {t.hero.description}
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {features.map((feature, idx) => (
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
              <TabsList className="grid grid-cols-4 w-full bg-card/50 border border-border/50">
                <TabsTrigger value="hardware" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <Usb className="w-4 h-4 mr-2" />
                  {t.tabs.hardware}
                </TabsTrigger>
                <TabsTrigger value="image" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <Camera className="w-4 h-4 mr-2" />
                  {t.tabs.image}
                </TabsTrigger>
                <TabsTrigger value="chat" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {t.tabs.expertAI}
                </TabsTrigger>
                <TabsTrigger value="guide" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <BookOpen className="w-4 h-4 mr-2" />
                  {t.tabs.guide}
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
                          {t.hardware.analyzing}
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          {t.hardware.analyzeButton} ({hardwareMeasurements.length} {t.hardware.measurements})
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <div className="text-center text-sm text-muted-foreground">
                  <p>
                    {t.hardware.connectPrompt}
                    {hardwareMeasurements.length > 0 && (
                      <span className="text-primary ml-1">
                        {t.hardware.combineWithImage}
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
                        ✓ {hardwareMeasurements.length} {t.hardware.measurementsReady}
                      </p>
                    </div>
                  )}
                  <ImageUploader onImageSelect={handleImageAnalysis} isAnalyzing={isAnalyzing} />
                </div>
              </TabsContent>

              <TabsContent value="chat" className="mt-6">
                <ExpertChat />
              </TabsContent>

              <TabsContent value="guide" className="mt-6">
                <HardwareGuide />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{t.diagnostic.title}</h2>
              <Button onClick={handleReset} variant="tech">
                <RotateCcw className="w-4 h-4" />
                {t.diagnostic.newAnalysis}
              </Button>
            </div>
            <DiagnosticResult data={diagnosticResult} imageUrl={analyzedImageUrl || undefined} />
            
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                {t.diagnostic.consultExpert}
              </h3>
              <ExpertChat />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

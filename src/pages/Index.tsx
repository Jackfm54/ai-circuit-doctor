import { useState } from "react";
import { Header } from "@/components/Header";
import { ImageUploader } from "@/components/ImageUploader";
import { DiagnosticResult, DiagnosticData } from "@/components/DiagnosticResult";
import { SerialConnection } from "@/components/SerialConnection";
import { HardwareGuide } from "@/components/HardwareGuide";
import { MeasurementData } from "@/hooks/useSerialConnection";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCcw, Cpu, Zap, Camera, Usb, BookOpen, MessageCircle, PlayCircle, ScanSearch, FileText, Info } from "lucide-react";
import type { BoundingBox } from "@/components/ImageAnalysisOverlay";
import { demoDiagnostic } from "@/data/demoDiagnostic";
import demoBoard from "@/assets/demo-board.jpg";
import { SchematicView } from "@/components/SchematicView";
import { demoSchematicFr } from "@/data/demoSchematic";
import { demoNetlistFr } from "@/data/demoNetlist";
import { ExpertChat } from "@/components/ExpertChat";
import { detectComponents } from "@/lib/yoloDetector";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { aiResponseError } from "@/lib/aiResponse";

function newReportMeta() {
  const date = new Date();
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, "");
  return { id: `CD-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`, date };
}

export default function Index() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticData | null>(null);
  const [hardwareMeasurements, setHardwareMeasurements] = useState<MeasurementData[]>([]);
  const [analyzedImageUrl, setAnalyzedImageUrl] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [reportMeta, setReportMeta] = useState<{ id: string; date: Date } | null>(null);
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const handleImageAnalysis = async (file: File, preview: string) => {
    setIsAnalyzing(true);
    setDiagnosticResult(null);
    setAnalyzedImageUrl(preview);

    try {
      const base64Image = preview.split(",")[1];

      // Run the trained component-detection model in the browser first; its
      // detections give the AI reliable component boxes to reason about.
      let yoloDetections;
      try {
        yoloDetections = await detectComponents(preview);
      } catch (detectError) {
        console.warn("Component detection model unavailable, falling back to AI-only analysis:", detectError);
      }

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
             imageMimeType: file.type,
            detections: yoloDetections?.length ? yoloDetections : undefined,
            measurements: hardwareMeasurements.length > 0 ? hardwareMeasurements : undefined,
            language
          }),
        }
      );

      const serviceError = await aiResponseError(response, language, t.toasts.analysisErrorDesc);
      if (serviceError) {
        toast({ title: t.toasts.analysisError, description: serviceError, variant: "destructive" });
        return;
      }

      const result = await response.json();
      setReportMeta(newReportMeta());
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

      const serviceError = await aiResponseError(response, language, t.toasts.analysisErrorDesc);
      if (serviceError) {
        toast({ title: t.toasts.analysisError, description: serviceError, variant: "destructive" });
        return;
      }

      const result = await response.json();
      setReportMeta(newReportMeta());
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
    setIsDemo(false);
  };

  const handleDemo = () => {
    setIsDemo(true);
    setReportMeta({ id: "CD-DEMO-0001", date: new Date() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const demoLang = language === "en" ? "en" : "fr";
  const shownResult = isDemo ? demoDiagnostic[demoLang] : diagnosticResult;
  const shownImage = isDemo ? demoBoard : analyzedImageUrl;
  const heroBoxes: BoundingBox[] = demoDiagnostic[demoLang].components
    .flatMap((c, i) => c.boundingBox ? [{ ...c.boundingBox, label: c.name, status: c.status, componentNumber: i + 1 }] : []);

  const steps = [
    { icon: Camera, title: t.pro.step1, desc: t.pro.step1Desc },
    { icon: ScanSearch, title: t.pro.step2, desc: t.pro.step2Desc },
    { icon: Cpu, title: t.pro.step3, desc: t.pro.step3Desc },
    { icon: FileText, title: t.pro.step4, desc: t.pro.step4Desc },
  ];

  const stats = [
    { value: "10", label: t.pro.statClasses },
    { value: "6", label: t.pro.statChannels },
    { value: "2", label: t.pro.statLanguages },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header onHome={handleReset} onDemo={handleDemo} />
      
      {/* Tech grid background */}
      <div className="no-print fixed inset-0 tech-grid opacity-20 pointer-events-none" />

      <main className="relative container mx-auto px-4 py-10 md:py-14">
        {!shownResult ? (
          <div className="space-y-20">
            {/* Hero */}
            <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/30 text-primary text-xs font-mono uppercase tracking-wider">
                  <Cpu className="w-3.5 h-3.5" />
                  {t.hero.badge}
                </div>
                <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
                  {t.hero.title}{" "}
                  <span className="text-primary">{t.hero.titleHighlight}</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-xl">{t.hero.description}</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="techGlow" size="lg" onClick={() => document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth" })}>
                    <Zap className="w-4 h-4" />
                    {t.pro.startButton}
                  </Button>
                  <Button variant="tech" size="lg" onClick={handleDemo}>
                    <PlayCircle className="w-4 h-4" />
                    {t.pro.demoButton}
                  </Button>
                </div>
                <dl className="flex gap-8 pt-4 border-t border-border/60 max-w-md">
                  {stats.map(s => (
                    <div key={s.label}>
                      <dt className="sr-only">{s.label}</dt>
                      <dd className="text-3xl font-semibold font-mono text-foreground">{s.value}</dd>
                      <dd className="text-xs text-muted-foreground mt-1">{s.label}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <button type="button" onClick={handleDemo} className="relative mx-auto w-full max-w-sm text-left rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
                <div className="flex items-center justify-between px-1 pb-2 text-[11px] font-mono text-muted-foreground">
                  <span>YOLO · {heroBoxes.length} / {demoDiagnostic[demoLang].components.length}</span>
                  <span className="text-success">● LIVE MODEL</span>
                </div>
                <div className="relative overflow-hidden rounded-lg border border-border">
                  <img src={demoBoard} alt={t.pro.demoButton} className="block w-full h-auto" />
                  {heroBoxes.map((b, i) => (
                    <span key={i} className={`absolute border ${b.status === "error" ? "border-destructive" : b.status === "warning" ? "border-warning" : "border-success"}`}
                      style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.width * 100}%`, height: `${b.height * 100}%` }} />
                  ))}
                </div>
              </button>
            </section>

            {/* How it works */}
            <section id="how" className="scroll-mt-24 space-y-8">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">01 — 04</p>
                <h2 className="text-3xl font-semibold tracking-tight mt-2">{t.pro.howTitle}</h2>
                <p className="text-muted-foreground mt-2">{t.pro.howSubtitle}</p>
              </div>
              <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
                {steps.map((step, i) => (
                  <li key={step.title} className="bg-card p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <step.icon className="w-5 h-5 text-primary" />
                      <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                    </div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </li>
                ))}
              </ol>
            </section>

            {/* Main Content Tabs */}
            <Tabs id="workspace" defaultValue="hardware" className="max-w-4xl mx-auto scroll-mt-24">
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
            {isDemo && (
              <div className="no-print flex flex-col sm:flex-row sm:items-center gap-3 justify-between p-4 rounded-lg border border-primary/30 bg-primary/10 text-sm">
                <span className="flex items-center gap-2"><Info className="w-4 h-4 text-primary shrink-0" />{t.pro.demoBanner}</span>
                <Button size="sm" variant="tech" onClick={handleReset}>{t.pro.exitDemo}</Button>
              </div>
            )}
            <div className="no-print flex items-center justify-end">
              <Button onClick={handleReset} variant="tech">
                <RotateCcw className="w-4 h-4" />
                {t.diagnostic.newAnalysis}
              </Button>
            </div>
            <DiagnosticResult data={shownResult} imageUrl={shownImage || undefined} reportId={reportMeta?.id} reportDate={reportMeta?.date} />
            <div className="max-w-5xl mx-auto">
              <SchematicView
                key={`${isDemo ? "demo" : reportMeta?.id}-${language}`}
                components={shownResult.components}
                summary={shownResult.summary}
                imageUrl={shownImage || undefined}
                reportId={reportMeta?.id}
                initialSchematic={isDemo && language !== "en" ? demoSchematicFr : null}
                initialNetlist={isDemo && language !== "en" ? demoNetlistFr : null}
              />
            </div>
            <p className="hidden print:block text-xs text-muted-foreground">{t.pro.footer}</p>

            <div className="no-print mt-8">
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

import { useState } from "react";
import { AlertTriangle, CheckCircle, XCircle, Cpu, Zap, ThermometerSun, CircuitBoard, Wrench, Package, Clock, Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ImageAnalysisOverlay, BoundingBox } from "./ImageAnalysisOverlay";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/i18n/LanguageContext";

export interface ComponentStatus {
  name: string;
  status: "ok" | "warning" | "error";
  details: string;
  location?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence?: number;
  severity?: number;
  solderQuality?: "good" | "cold" | "bridge" | "excess" | "insufficient" | "lifted";
  repairDifficulty?: "easy" | "medium" | "hard" | "expert";
  estimatedRepairTime?: string;
  replacementPart?: string;
}

export interface SolderAnalysis {
  overallQuality: "good" | "fair" | "poor";
  coldJoints: number;
  bridges: number;
  excessSolder: number;
  insufficientSolder: number;
  liftedComponents: number;
}

export interface RepairStep {
  step: number;
  action: string;
  component: string;
  tools: string[];
  difficulty: "easy" | "medium" | "hard";
  estimatedTime: string;
  tips?: string;
}

export interface PartToReplace {
  component: string;
  reference: string;
  quantity: number;
  reason: string;
}

export interface DiagnosticData {
  summary: string;
  overallStatus: "ok" | "warning" | "error";
  overallSeverity?: number;
  components: ComponentStatus[];
  recommendations: string[];
  solderAnalysis?: SolderAnalysis;
  repairGuide?: RepairStep[];
  partsToReplace?: PartToReplace[];
}

interface DiagnosticResultProps {
  data: DiagnosticData;
  imageUrl?: string;
}

const statusConfig = {
  ok: {
    icon: CheckCircle,
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
  },
  error: {
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
  },
};

const componentIcons: Record<string, typeof Cpu> = {
  capacitor: Zap,
  resistor: ThermometerSun,
  chip: Cpu,
  default: CircuitBoard,
};

function getComponentIcon(name: string) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("capacitor") || lowerName.includes("condensador")) return componentIcons.capacitor;
  if (lowerName.includes("resistor") || lowerName.includes("resistencia")) return componentIcons.resistor;
  if (lowerName.includes("chip") || lowerName.includes("ic") || lowerName.includes("integrado")) return componentIcons.chip;
  return componentIcons.default;
}

function getSeverityColor(severity: number): string {
  if (severity <= 3) return "text-success";
  if (severity <= 6) return "text-warning";
  return "text-destructive";
}

function getSeverityBg(severity: number): string {
  if (severity <= 3) return "bg-success";
  if (severity <= 6) return "bg-warning";
  return "bg-destructive";
}

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "easy": return "text-success bg-success/10 border-success/30";
    case "medium": return "text-warning bg-warning/10 border-warning/30";
    case "hard": return "text-destructive bg-destructive/10 border-destructive/30";
    case "expert": return "text-purple-500 bg-purple-500/10 border-purple-500/30";
    default: return "text-muted-foreground bg-muted border-border";
  }
}

function getSolderQualityLabel(quality: string, t: any): string {
  const labels: Record<string, string> = {
    good: t.diagnostic?.solderGood || "Buena",
    cold: t.diagnostic?.solderCold || "Fría",
    bridge: t.diagnostic?.solderBridge || "Puente",
    excess: t.diagnostic?.solderExcess || "Exceso",
    insufficient: t.diagnostic?.solderInsufficient || "Insuficiente",
    lifted: t.diagnostic?.solderLifted || "Levantado",
  };
  return labels[quality] || quality;
}

export function DiagnosticResult({ data, imageUrl }: DiagnosticResultProps) {
  const [selectedComponentIndex, setSelectedComponentIndex] = useState<number | undefined>();
  const { t } = useLanguage();
  
  const overallConfig = statusConfig[data.overallStatus];
  const OverallIcon = overallConfig.icon;

  const faultyComponents = data.components.filter(c => c.status === "error");
  const warningComponents = data.components.filter(c => c.status === "warning");

  const boundingBoxes: BoundingBox[] = data.components
    .filter(c => c.boundingBox)
    .map(c => ({
      x: c.boundingBox!.x,
      y: c.boundingBox!.y,
      width: c.boundingBox!.width,
      height: c.boundingBox!.height,
      label: c.name,
      status: c.status,
      confidence: c.confidence,
    }));

  const handleBoxClick = (box: BoundingBox, index: number) => {
    setSelectedComponentIndex(index);
    const element = document.getElementById(`component-${index}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const labels = {
    visualAnalysis: t.diagnostic?.visualAnalysis || "Análisis Visual - Detección de Componentes",
    clickHint: t.diagnostic?.clickHint || "Haz clic en los recuadros para ver detalles del componente",
    diagnosticResult: t.diagnostic?.diagnosticResult || "Resultado del Diagnóstico",
    severity: t.diagnostic?.severity || "Severidad",
    operative: t.diagnostic?.operative || "Operativos",
    warnings: t.diagnostic?.warnings || "Advertencias",
    faults: t.diagnostic?.faults || "Con fallas",
    analyzedComponents: t.diagnostic?.analyzedComponents || "Componentes Analizados",
    solderAnalysis: t.diagnostic?.solderAnalysis || "Análisis de Soldaduras",
    solderQuality: t.diagnostic?.solderQuality || "Calidad General",
    coldJoints: t.diagnostic?.coldJoints || "Soldaduras Frías",
    bridges: t.diagnostic?.bridges || "Puentes",
    excessSolder: t.diagnostic?.excessSolder || "Exceso de Estaño",
    insufficientSolder: t.diagnostic?.insufficientSolder || "Estaño Insuficiente",
    liftedComponents: t.diagnostic?.liftedComponents || "Componentes Levantados",
    repairGuide: t.diagnostic?.repairGuide || "Guía de Reparación",
    step: t.diagnostic?.step || "Paso",
    tools: t.diagnostic?.tools || "Herramientas",
    tips: t.diagnostic?.tips || "Consejos",
    partsToReplace: t.diagnostic?.partsToReplace || "Componentes a Reemplazar",
    reference: t.diagnostic?.reference || "Referencia",
    quantity: t.diagnostic?.quantity || "Cantidad",
    reason: t.diagnostic?.reason || "Razón",
    recommendations: t.diagnostic?.recommendations || "Recomendaciones",
    statusOk: t.diagnostic?.statusOk || "Operativo",
    statusWarning: t.diagnostic?.statusWarning || "Advertencia",
    statusError: t.diagnostic?.statusError || "Fallo detectado",
    tabComponents: t.diagnostic?.tabComponents || "Componentes",
    tabSolder: t.diagnostic?.tabSolder || "Soldaduras",
    tabRepair: t.diagnostic?.tabRepair || "Reparación",
    tabParts: t.diagnostic?.tabParts || "Repuestos",
  };

  const statusLabels = {
    ok: labels.statusOk,
    warning: labels.statusWarning,
    error: labels.statusError,
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Image with bounding boxes */}
      {imageUrl && boundingBoxes.length > 0 && (
        <Card className="border-primary/20 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <CircuitBoard className="w-5 h-5 text-primary" />
              {labels.visualAnalysis}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageAnalysisOverlay
              imageUrl={imageUrl}
              boundingBoxes={boundingBoxes}
              onBoxClick={handleBoxClick}
              selectedIndex={selectedComponentIndex}
            />
            <p className="text-xs text-muted-foreground mt-3 text-center">
              {labels.clickHint}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Overall Status Card with Severity */}
      <Card className={cn("border-2 glow-border", overallConfig.border)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={cn("p-3 rounded-xl", overallConfig.bg)}>
              <OverallIcon className={cn("w-8 h-8", overallConfig.color)} />
            </div>
            <div className="flex-1">
              <Badge variant="outline" className={cn("mb-1", overallConfig.color, overallConfig.border)}>
                {statusLabels[data.overallStatus]}
              </Badge>
              <CardTitle className="text-xl">{labels.diagnosticResult}</CardTitle>
            </div>
            {data.overallSeverity && (
              <div className="text-center">
                <div className={cn("text-3xl font-bold font-mono", getSeverityColor(data.overallSeverity))}>
                  {data.overallSeverity}/10
                </div>
                <div className="text-xs text-muted-foreground">{labels.severity}</div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{data.summary}</p>
          
          {data.overallSeverity && (
            <div className="mt-4">
              <Progress 
                value={data.overallSeverity * 10} 
                className={cn("h-2", getSeverityBg(data.overallSeverity))}
              />
            </div>
          )}
          
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 rounded-lg bg-success/5 border border-success/20">
              <div className="text-2xl font-bold text-success font-mono">
                {data.components.filter(c => c.status === "ok").length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{labels.operative}</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-warning/5 border border-warning/20">
              <div className="text-2xl font-bold text-warning font-mono">
                {warningComponents.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{labels.warnings}</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <div className="text-2xl font-bold text-destructive font-mono">
                {faultyComponents.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{labels.faults}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="components" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="components" className="flex items-center gap-1">
            <CircuitBoard className="w-4 h-4" />
            <span className="hidden sm:inline">{labels.tabComponents}</span>
          </TabsTrigger>
          <TabsTrigger value="solder" className="flex items-center gap-1">
            <Gauge className="w-4 h-4" />
            <span className="hidden sm:inline">{labels.tabSolder}</span>
          </TabsTrigger>
          <TabsTrigger value="repair" className="flex items-center gap-1">
            <Wrench className="w-4 h-4" />
            <span className="hidden sm:inline">{labels.tabRepair}</span>
          </TabsTrigger>
          <TabsTrigger value="parts" className="flex items-center gap-1">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">{labels.tabParts}</span>
          </TabsTrigger>
        </TabsList>

        {/* Components Tab */}
        <TabsContent value="components">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CircuitBoard className="w-5 h-5 text-primary" />
                {labels.analyzedComponents}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.components.map((component, idx) => {
                  const config = statusConfig[component.status];
                  const StatusIcon = config.icon;
                  const ComponentIcon = getComponentIcon(component.name);
                  const isSelected = selectedComponentIndex === idx;
                  
                  return (
                    <div
                      key={idx}
                      id={`component-${idx}`}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer",
                        config.bg,
                        config.border,
                        isSelected && "ring-2 ring-primary scale-[1.02]",
                        !isSelected && "hover:scale-[1.01]"
                      )}
                      onClick={() => setSelectedComponentIndex(isSelected ? undefined : idx)}
                    >
                      <div className={cn("p-2 rounded-lg", config.bg)}>
                        <ComponentIcon className={cn("w-5 h-5", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium font-mono">{component.name}</span>
                          {component.severity && (
                            <Badge variant="outline" className={cn("text-xs", getSeverityColor(component.severity))}>
                              {labels.severity}: {component.severity}/10
                            </Badge>
                          )}
                          {component.location && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {component.location}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{component.details}</p>
                        
                        {/* Additional component details */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {component.solderQuality && component.solderQuality !== "good" && (
                            <Badge variant="outline" className="text-xs">
                              🔧 {getSolderQualityLabel(component.solderQuality, t)}
                            </Badge>
                          )}
                          {component.repairDifficulty && (
                            <Badge variant="outline" className={cn("text-xs", getDifficultyColor(component.repairDifficulty))}>
                              {component.repairDifficulty}
                            </Badge>
                          )}
                          {component.estimatedRepairTime && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {component.estimatedRepairTime}
                            </Badge>
                          )}
                          {component.confidence && (
                            <Badge variant="outline" className="text-xs">
                              {Math.round(component.confidence * 100)}% conf.
                            </Badge>
                          )}
                        </div>
                      </div>
                      <StatusIcon className={cn("w-5 h-5 flex-shrink-0", config.color)} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Solder Analysis Tab */}
        <TabsContent value="solder">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-primary" />
                {labels.solderAnalysis}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.solderAnalysis ? (
                <div className="space-y-6">
                  {/* Overall quality */}
                  <div className="text-center p-6 rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground mb-2">{labels.solderQuality}</div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-lg px-4 py-2",
                        data.solderAnalysis.overallQuality === "good" && "text-success border-success",
                        data.solderAnalysis.overallQuality === "fair" && "text-warning border-warning",
                        data.solderAnalysis.overallQuality === "poor" && "text-destructive border-destructive"
                      )}
                    >
                      {data.solderAnalysis.overallQuality === "good" && "✓ Buena"}
                      {data.solderAnalysis.overallQuality === "fair" && "⚠ Regular"}
                      {data.solderAnalysis.overallQuality === "poor" && "✗ Pobre"}
                    </Badge>
                  </div>

                  {/* Defect counts */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border bg-card text-center">
                      <div className="text-2xl font-bold text-warning font-mono">{data.solderAnalysis.coldJoints}</div>
                      <div className="text-xs text-muted-foreground">{labels.coldJoints}</div>
                    </div>
                    <div className="p-4 rounded-lg border bg-card text-center">
                      <div className="text-2xl font-bold text-destructive font-mono">{data.solderAnalysis.bridges}</div>
                      <div className="text-xs text-muted-foreground">{labels.bridges}</div>
                    </div>
                    <div className="p-4 rounded-lg border bg-card text-center">
                      <div className="text-2xl font-bold text-warning font-mono">{data.solderAnalysis.excessSolder}</div>
                      <div className="text-xs text-muted-foreground">{labels.excessSolder}</div>
                    </div>
                    <div className="p-4 rounded-lg border bg-card text-center">
                      <div className="text-2xl font-bold text-warning font-mono">{data.solderAnalysis.insufficientSolder}</div>
                      <div className="text-xs text-muted-foreground">{labels.insufficientSolder}</div>
                    </div>
                    <div className="p-4 rounded-lg border bg-card text-center">
                      <div className="text-2xl font-bold text-destructive font-mono">{data.solderAnalysis.liftedComponents}</div>
                      <div className="text-xs text-muted-foreground">{labels.liftedComponents}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No hay datos de análisis de soldaduras disponibles
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Repair Guide Tab */}
        <TabsContent value="repair">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" />
                {labels.repairGuide}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.repairGuide && data.repairGuide.length > 0 ? (
                <div className="space-y-4">
                  {data.repairGuide.map((step, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-lg border bg-card">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{step.action}</span>
                          <Badge variant="outline" className={getDifficultyColor(step.difficulty)}>
                            {step.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {step.estimatedTime}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Componente:</strong> {step.component}
                        </p>
                        {step.tools && step.tools.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            <span className="text-xs text-muted-foreground">{labels.tools}:</span>
                            {step.tools.map((tool, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {step.tips && (
                          <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                            💡 {step.tips}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No se requieren reparaciones
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parts to Replace Tab */}
        <TabsContent value="parts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                {labels.partsToReplace}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.partsToReplace && data.partsToReplace.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Componente</th>
                        <th className="text-left p-3 font-medium">{labels.reference}</th>
                        <th className="text-center p-3 font-medium">{labels.quantity}</th>
                        <th className="text-left p-3 font-medium">{labels.reason}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.partsToReplace.map((part, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-mono text-sm">{part.component}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="font-mono">
                              {part.reference}
                            </Badge>
                          </td>
                          <td className="p-3 text-center font-bold">{part.quantity}</td>
                          <td className="p-3 text-sm text-muted-foreground">{part.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No se requieren reemplazos
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              {labels.recommendations}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-mono flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-muted-foreground">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

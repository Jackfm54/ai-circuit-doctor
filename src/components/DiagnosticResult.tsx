import { useState } from "react";
import { AlertTriangle, CheckCircle, XCircle, Cpu, Zap, ThermometerSun, CircuitBoard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ImageAnalysisOverlay, BoundingBox } from "./ImageAnalysisOverlay";

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
}

export interface DiagnosticData {
  summary: string;
  overallStatus: "ok" | "warning" | "error";
  components: ComponentStatus[];
  recommendations: string[];
}

interface DiagnosticResultProps {
  data: DiagnosticData;
  imageUrl?: string;
}

const statusConfig = {
  ok: {
    icon: CheckCircle,
    label: "Operativo",
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
  },
  warning: {
    icon: AlertTriangle,
    label: "Advertencia",
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
  },
  error: {
    icon: XCircle,
    label: "Fallo detectado",
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
  if (lowerName.includes("capacitor")) return componentIcons.capacitor;
  if (lowerName.includes("resistor") || lowerName.includes("resistencia")) return componentIcons.resistor;
  if (lowerName.includes("chip") || lowerName.includes("ic") || lowerName.includes("integrado")) return componentIcons.chip;
  return componentIcons.default;
}

export function DiagnosticResult({ data, imageUrl }: DiagnosticResultProps) {
  const [selectedComponentIndex, setSelectedComponentIndex] = useState<number | undefined>();
  
  const overallConfig = statusConfig[data.overallStatus];
  const OverallIcon = overallConfig.icon;

  const faultyComponents = data.components.filter(c => c.status === "error");
  const warningComponents = data.components.filter(c => c.status === "warning");

  // Convert components with bounding boxes to overlay format
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
    // Scroll to component in list
    const element = document.getElementById(`component-${index}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Image with bounding boxes */}
      {imageUrl && boundingBoxes.length > 0 && (
        <Card className="border-primary/20 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <CircuitBoard className="w-5 h-5 text-primary" />
              Análisis Visual - Detección de Componentes
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
              Haz clic en los recuadros para ver detalles del componente
            </p>
          </CardContent>
        </Card>
      )}

      {/* Overall Status Card */}
      <Card className={cn("border-2 glow-border", overallConfig.border)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={cn("p-3 rounded-xl", overallConfig.bg)}>
              <OverallIcon className={cn("w-8 h-8", overallConfig.color)} />
            </div>
            <div>
              <Badge variant="outline" className={cn("mb-1", overallConfig.color, overallConfig.border)}>
                {overallConfig.label}
              </Badge>
              <CardTitle className="text-xl">Resultado del Diagnóstico</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{data.summary}</p>
          
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 rounded-lg bg-success/5 border border-success/20">
              <div className="text-2xl font-bold text-success font-mono">
                {data.components.filter(c => c.status === "ok").length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Operativos</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-warning/5 border border-warning/20">
              <div className="text-2xl font-bold text-warning font-mono">
                {warningComponents.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Advertencias</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <div className="text-2xl font-bold text-destructive font-mono">
                {faultyComponents.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Con fallas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Components Detail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircuitBoard className="w-5 h-5 text-primary" />
            Componentes Analizados
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
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium font-mono">{component.name}</span>
                      {component.location && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {component.location}
                        </span>
                      )}
                      {component.confidence && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(component.confidence * 100)}% conf.
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{component.details}</p>
                  </div>
                  <StatusIcon className={cn("w-5 h-5 flex-shrink-0", config.color)} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Recomendaciones
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

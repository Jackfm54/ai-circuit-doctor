import { useState } from "react";
import { Usb, Wifi, WifiOff, Zap, Activity, Radio, AlertCircle, Play, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSerialConnection, MeasurementData } from "@/hooks/useSerialConnection";
import { cn } from "@/lib/utils";

interface SerialConnectionProps {
  onMeasurementsReady?: (measurements: MeasurementData[]) => void;
}

const measurementIcons: Record<MeasurementData["type"], typeof Zap> = {
  voltage: Zap,
  continuity: Radio,
  resistance: Activity,
  signal: Activity,
};

const measurementLabels: Record<MeasurementData["type"], string> = {
  voltage: "Voltaje",
  continuity: "Continuidad",
  resistance: "Resistencia",
  signal: "Señal",
};

export function SerialConnection({ onMeasurementsReady }: SerialConnectionProps) {
  const {
    isConnected,
    isSupported,
    portName,
    measurements,
    lastError,
    connect,
    disconnect,
    startScan,
    stopScan,
    clearMeasurements,
  } = useSerialConnection();

  const [isScanning, setIsScanning] = useState(false);

  const handleConnect = async () => {
    await connect();
  };

  const handleStartScan = async () => {
    setIsScanning(true);
    await startScan();
  };

  const handleStopScan = async () => {
    setIsScanning(false);
    await stopScan();
    if (onMeasurementsReady && measurements.length > 0) {
      onMeasurementsReady(measurements);
    }
  };

  const getStatusColor = (status: MeasurementData["status"]) => {
    switch (status) {
      case "ok":
        return "text-success";
      case "warning":
        return "text-warning";
      case "error":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const latestByChannel = measurements.reduce((acc, m) => {
    const key = `${m.type}-${m.channel}`;
    if (!acc[key] || acc[key].timestamp < m.timestamp) {
      acc[key] = m;
    }
    return acc;
  }, {} as Record<string, MeasurementData>);

  if (!isSupported) {
    return (
      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Tu navegador no soporta Web Serial API. Usa Chrome, Edge o Opera para conectar hardware.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Usb className="w-5 h-5 text-primary" />
            Conexión Hardware
          </CardTitle>
          <Badge
            variant="outline"
            className={cn(
              isConnected
                ? "border-success/50 text-success bg-success/10"
                : "border-muted-foreground/50 text-muted-foreground"
            )}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3 mr-1" />
                Conectado
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1" />
                Desconectado
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastError && (
          <Alert variant="destructive" className="border-destructive/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{lastError}</AlertDescription>
          </Alert>
        )}

        {!isConnected ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Conecta tu Arduino/ESP32 para realizar mediciones físicas en la tarjeta electrónica.
            </p>
            <Button onClick={handleConnect} variant="techGlow" className="w-full">
              <Usb className="w-4 h-4 mr-2" />
              Conectar Dispositivo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Puerto:</span>
              <span className="font-mono text-primary">{portName}</span>
            </div>

            <div className="flex gap-2">
              {!isScanning ? (
                <Button onClick={handleStartScan} variant="success" className="flex-1">
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar Escaneo
                </Button>
              ) : (
                <Button onClick={handleStopScan} variant="warning" className="flex-1">
                  <Square className="w-4 h-4 mr-2" />
                  Detener Escaneo
                </Button>
              )}
              <Button onClick={disconnect} variant="techOutline" size="icon">
                <WifiOff className="w-4 h-4" />
              </Button>
            </div>

            {/* Live Measurements */}
            {Object.keys(latestByChannel).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Mediciones en Vivo</h4>
                  <Button
                    onClick={clearMeasurements}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Limpiar
                  </Button>
                </div>
                <ScrollArea className="h-48 rounded-lg border border-border/50 bg-background/50">
                  <div className="p-3 space-y-2">
                    {Object.values(latestByChannel).map((m, idx) => {
                      const Icon = measurementIcons[m.type];
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg bg-card/50 border",
                            m.status === "ok" && "border-success/20",
                            m.status === "warning" && "border-warning/20",
                            m.status === "error" && "border-destructive/20"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={cn("w-4 h-4", getStatusColor(m.status))} />
                            <span className="text-sm font-medium">
                              {measurementLabels[m.type]} CH{m.channel}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn("font-mono text-sm", getStatusColor(m.status))}>
                              {m.value.toFixed(2)} {m.unit}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                m.status === "ok" && "border-success/30 text-success",
                                m.status === "warning" && "border-warning/30 text-warning",
                                m.status === "error" && "border-destructive/30 text-destructive"
                              )}
                            >
                              {m.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                <p className="text-xs text-muted-foreground text-center">
                  {measurements.length} mediciones registradas
                </p>
              </div>
            )}

            {isScanning && Object.keys(latestByChannel).length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Activity className="w-8 h-8 animate-pulse text-primary mb-2" />
                <p className="text-sm">Esperando datos del dispositivo...</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

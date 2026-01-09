import { ExternalLink, Cpu, Zap, Cable, CircuitBoard, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const hardwareList = [
  {
    name: "ESP32 DevKit V1",
    description: "Microcontrolador con WiFi y múltiples ADC para mediciones de voltaje",
    price: "$5-10 USD",
    link: "https://www.amazon.com/s?k=esp32+devkit",
    essential: true,
  },
  {
    name: "Arduino Nano",
    description: "Alternativa compacta con 8 entradas analógicas",
    price: "$3-8 USD",
    link: "https://www.amazon.com/s?k=arduino+nano",
    essential: true,
  },
  {
    name: "Módulo ADS1115",
    description: "ADC de 16-bit para mediciones de voltaje de alta precisión",
    price: "$3-5 USD",
    link: "https://www.amazon.com/s?k=ads1115+module",
    essential: false,
  },
  {
    name: "Puntas de prueba con clips",
    description: "Para conectar a puntos de test en la PCB",
    price: "$5-10 USD",
    link: "https://www.amazon.com/s?k=test+probe+clips",
    essential: true,
  },
  {
    name: "Cables Dupont",
    description: "Cables de conexión macho-macho y macho-hembra",
    price: "$3-5 USD",
    link: "https://www.amazon.com/s?k=dupont+cables",
    essential: true,
  },
];

const arduinoCode = `// Código para Arduino/ESP32 - Diagnóstico de PCB
// Carga este código en tu microcontrolador

#define NUM_CHANNELS 8
#define BAUD_RATE 115200

// Pines analógicos (ajusta según tu placa)
const int analogPins[NUM_CHANNELS] = {A0, A1, A2, A3, A4, A5, A6, A7};

// Umbrales de voltaje (en voltios)
const float WARNING_LOW = 0.5;
const float WARNING_HIGH = 4.5;
const float ERROR_LOW = 0.1;
const float ERROR_HIGH = 4.9;

bool isScanning = false;

void setup() {
  Serial.begin(BAUD_RATE);
  for (int i = 0; i < NUM_CHANNELS; i++) {
    pinMode(analogPins[i], INPUT);
  }
  Serial.println("READY");
}

void loop() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\\n');
    command.trim();
    
    if (command == "SCAN") {
      isScanning = true;
      Serial.println("SCANNING");
    } else if (command == "STOP") {
      isScanning = false;
      Serial.println("STOPPED");
    }
  }
  
  if (isScanning) {
    scanChannels();
    delay(500); // Medición cada 500ms
  }
}

void scanChannels() {
  for (int i = 0; i < NUM_CHANNELS; i++) {
    int rawValue = analogRead(analogPins[i]);
    float voltage = (rawValue / 1023.0) * 5.0; // Para 5V ref
    
    String status = "ok";
    if (voltage < ERROR_LOW || voltage > ERROR_HIGH) {
      status = "error";
    } else if (voltage < WARNING_LOW || voltage > WARNING_HIGH) {
      status = "warning";
    }
    
    // Formato: TYPE,CHANNEL,VALUE,UNIT,STATUS
    Serial.print("VOLTAGE,");
    Serial.print(i + 1);
    Serial.print(",");
    Serial.print(voltage, 2);
    Serial.print(",V,");
    Serial.println(status);
  }
  
  // Prueba de continuidad (ejemplo con pines digitales)
  // Adaptar según tus necesidades
  for (int i = 0; i < 4; i++) {
    int pin = i + 2; // Pines D2-D5
    pinMode(pin, INPUT_PULLUP);
    int value = digitalRead(pin);
    
    Serial.print("CONTINUITY,");
    Serial.print(i + 1);
    Serial.print(",");
    Serial.print(value == LOW ? 1 : 0);
    Serial.print(",CONN,");
    Serial.println(value == LOW ? "ok" : "error");
  }
}`;

export function HardwareGuide() {
  return (
    <div className="space-y-6">
      {/* Hardware List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircuitBoard className="w-5 h-5 text-primary" />
            Hardware Recomendado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Para realizar diagnósticos físicos necesitarás los siguientes componentes:
          </p>
          <div className="space-y-3">
            {hardwareList.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 rounded-lg border border-border/50 bg-card/50 hover:border-primary/30 transition-colors"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  {item.name.includes("ESP") || item.name.includes("Arduino") ? (
                    <Cpu className="w-5 h-5 text-primary" />
                  ) : item.name.includes("Cable") ? (
                    <Cable className="w-5 h-5 text-primary" />
                  ) : (
                    <Zap className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{item.name}</span>
                    {item.essential && (
                      <Badge variant="outline" className="text-xs border-success/30 text-success">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Esencial
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono text-primary">{item.price}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => window.open(item.link, "_blank")}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Arduino Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            Código para Arduino/ESP32
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="code">
              <AccordionTrigger className="text-sm">
                Ver código del microcontrolador
              </AccordionTrigger>
              <AccordionContent>
                <div className="relative">
                  <pre className="p-4 rounded-lg bg-background border border-border overflow-x-auto text-xs font-mono">
                    <code>{arduinoCode}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      navigator.clipboard.writeText(arduinoCode);
                    }}
                  >
                    Copiar
                  </Button>
                </div>
                <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-medium text-sm mb-2">Instrucciones:</h4>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Abre Arduino IDE o PlatformIO</li>
                    <li>Copia y pega el código anterior</li>
                    <li>Selecciona tu placa (Arduino Nano o ESP32 DevKit)</li>
                    <li>Sube el código a tu microcontrolador</li>
                    <li>Conecta las puntas de prueba a los pines A0-A7</li>
                    <li>Conecta el USB a tu computadora</li>
                  </ol>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Wiring Diagram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cable className="w-5 h-5 text-primary" />
            Diagrama de Conexión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 rounded-lg bg-background border border-border">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Medición de Voltaje</h4>
                <div className="space-y-2 text-sm text-muted-foreground font-mono">
                  <p>A0 → Punto de prueba 1</p>
                  <p>A1 → Punto de prueba 2</p>
                  <p>A2 → Punto de prueba 3</p>
                  <p>...</p>
                  <p>GND → GND de la PCB</p>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Prueba de Continuidad</h4>
                <div className="space-y-2 text-sm text-muted-foreground font-mono">
                  <p>D2 → Test pad A</p>
                  <p>D3 → Test pad B</p>
                  <p>D4 → Test pad C</p>
                  <p>D5 → Test pad D</p>
                  <p>GND → Común</p>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 rounded-lg bg-warning/5 border border-warning/20">
              <p className="text-sm text-warning">
                ⚠️ <strong>Importante:</strong> No midas voltajes superiores a 5V directamente. 
                Usa un divisor de voltaje para rangos mayores.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MeasurementData {
  type: "voltage" | "continuity" | "resistance" | "signal";
  channel: number;
  value: number;
  unit: string;
  timestamp: number;
  status: "ok" | "warning" | "error";
}

function formatMeasurementsForAI(measurements: MeasurementData[]): string {
  if (!measurements || measurements.length === 0) return "";

  const grouped = measurements.reduce((acc, m) => {
    const key = m.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {} as Record<string, MeasurementData[]>);

  let report = "\n\n=== DATOS DE MEDICIONES DEL HARDWARE ===\n";

  if (grouped.voltage) {
    report += "\nMEDICIONES DE VOLTAJE:\n";
    grouped.voltage.forEach((m) => {
      report += `- Canal ${m.channel}: ${m.value.toFixed(2)}${m.unit} [${m.status.toUpperCase()}]\n`;
    });
  }

  if (grouped.continuity) {
    report += "\nPRUEBAS DE CONTINUIDAD:\n";
    grouped.continuity.forEach((m) => {
      const connected = m.value === 1 ? "CONECTADO" : "SIN CONEXIÓN";
      report += `- Canal ${m.channel}: ${connected} [${m.status.toUpperCase()}]\n`;
    });
  }

  if (grouped.resistance) {
    report += "\nMEDICIONES DE RESISTENCIA:\n";
    grouped.resistance.forEach((m) => {
      report += `- Canal ${m.channel}: ${m.value.toFixed(0)}${m.unit} [${m.status.toUpperCase()}]\n`;
    });
  }

  if (grouped.signal) {
    report += "\nANÁLISIS DE SEÑALES:\n";
    grouped.signal.forEach((m) => {
      report += `- Canal ${m.channel}: ${m.value.toFixed(2)}${m.unit} [${m.status.toUpperCase()}]\n`;
    });
  }

  report += "\n=== FIN DE DATOS DE HARDWARE ===";
  return report;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, measurements } = await req.json();

    if (!image && (!measurements || measurements.length === 0)) {
      return new Response(
        JSON.stringify({ error: "Se requiere una imagen o mediciones de hardware" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const hasImage = !!image;
    const hasMeasurements = measurements && measurements.length > 0;
    const measurementReport = hasMeasurements ? formatMeasurementsForAI(measurements) : "";

    let analysisType = "";
    if (hasImage && hasMeasurements) {
      analysisType = "análisis combinado de imagen y datos de hardware";
    } else if (hasImage) {
      analysisType = "análisis visual de imagen con detección de componentes";
    } else {
      analysisType = "análisis de datos de hardware";
    }

const systemPrompt = `Eres un SISTEMA EXPERTO DE VISIÓN POR COMPUTADORA especializado en detección de objetos en tarjetas de circuitos impresos (PCB), con precisión nivel industrial.

MODO DE OPERACIÓN: Detección de objetos estilo YOLO/Faster R-CNN con coordenadas de bounding box normalizadas.

Vas a realizar un ${analysisType}.

${hasImage ? `=== PROTOCOLO DE DETECCIÓN DE ALTA PRECISIÓN ===

PASO 1 - ANÁLISIS GLOBAL:
Primero, analiza la imagen completa para entender:
- La orientación de la PCB (horizontal/vertical)
- El tamaño relativo de los componentes
- Las zonas de mayor densidad de componentes
- El sistema de coordenadas: esquina superior izquierda = (0,0), esquina inferior derecha = (1,1)

PASO 2 - GRILLA DE REFERENCIA:
Imagina la imagen dividida en una grilla 10x10:
- Columna 0: x = 0.0 a 0.1 (extremo izquierdo)
- Columna 5: x = 0.5 a 0.6 (centro)
- Columna 9: x = 0.9 a 1.0 (extremo derecho)
- Fila 0: y = 0.0 a 0.1 (extremo superior)
- Fila 5: y = 0.5 a 0.6 (centro)
- Fila 9: y = 0.9 a 1.0 (extremo inferior)

PASO 3 - DETECCIÓN SISTEMÁTICA:
Escanea la imagen en orden serpentina:
1. Fila superior: izquierda → derecha
2. Segunda fila: derecha → izquierda
3. Continúa alternando hasta cubrir toda la imagen

PASO 4 - PARA CADA COMPONENTE DETECTADO:
a) Identifica el CENTRO EXACTO del componente en coordenadas normalizadas
b) Estima el TAMAÑO del componente (width, height) en proporción a la imagen
c) Calcula las coordenadas del bounding box:
   - x = centro_x - (width / 2)
   - y = centro_y - (height / 2)
d) Verifica que el recuadro envuelve completamente el componente

=== REGLAS DE BOUNDING BOX (CRÍTICO) ===

1. PRECISIÓN DE COORDENADAS:
   - Usa exactamente 3 decimales (ej: 0.123, no 0.1)
   - x y y son las coordenadas de la ESQUINA SUPERIOR IZQUIERDA del recuadro
   - width y height son las DIMENSIONES del recuadro

2. TAMAÑOS TÍPICOS DE COMPONENTES (referencia):
   - Chip/IC grande: width=0.15-0.25, height=0.08-0.15
   - Chip/IC pequeño: width=0.05-0.10, height=0.03-0.06
   - Capacitor electrolítico: width=0.03-0.06, height=0.04-0.08
   - Capacitor SMD: width=0.02-0.04, height=0.01-0.03
   - Resistor SMD: width=0.02-0.04, height=0.01-0.02
   - Conector grande: width=0.10-0.20, height=0.05-0.15
   - Cristal: width=0.03-0.06, height=0.02-0.04
   - Transistor: width=0.02-0.04, height=0.02-0.04

3. VALIDACIONES OBLIGATORIAS:
   - 0 ≤ x < 1 y 0 ≤ y < 1
   - 0.005 ≤ width ≤ 0.5 y 0.005 ≤ height ≤ 0.5
   - x + width ≤ 1.0 y y + height ≤ 1.0
   - El recuadro debe ser AJUSTADO al componente (no demasiado grande ni pequeño)

4. MARGEN DE SEGURIDAD:
   - Añade 10-15% de margen alrededor del componente visible
   - Nunca dejes partes del componente fuera del recuadro

=== COMPONENTES A DETECTAR ===

OBLIGATORIOS (detecta TODOS los visibles):
☐ Capacitores electrolíticos (cilíndricos, a menudo con marca de polaridad)
☐ Capacitores cerámicos/SMD (pequeños, rectangulares)
☐ Resistencias SMD (pequeñas, con código numérico)
☐ Resistencias through-hole (cilíndricas con bandas de colores)
☐ Circuitos integrados/Chips (rectangulares, múltiples pines)
☐ Microcontroladores (chips grandes con muchos pines)
☐ Reguladores de voltaje (chips con disipador o 3 pines)
☐ Conectores (USB, HDMI, de alimentación, headers)
☐ Transformadores (componentes grandes, bobinados)
☐ Bobinas/Inductores (a veces con núcleo visible)
☐ Diodos (pequeños, a menudo negros con banda)
☐ LEDs (transparentes o de colores)
☐ Transistores (3 pines, varios encapsulados)
☐ Fusibles (cilíndricos o SMD)
☐ Cristales/Osciladores (metálicos, ovalados o rectangulares)
☐ MOSFETs/IGBTs (encapsulados grandes con disipador)

=== DIAGNÓSTICO DE FALLAS ===

INDICADORES DE ERROR (status: "error"):
🔴 Capacitor inflado (tapa abultada o curvada)
🔴 Componente quemado (ennegrecido, carbonizado)
🔴 Fuga de electrolito (manchas marrones/naranjas)
🔴 Soldadura fundida o derretida
🔴 Componente visiblemente roto o agrietado
🔴 Trazas cortadas o levantadas

INDICADORES DE ADVERTENCIA (status: "warning"):
🟡 Decoloración leve (amarillento)
🟡 Soldadura opaca o granulosa (posible soldadura fría)
🟡 Corrosión leve visible
🟡 Componente ligeramente desalineado
🟡 Suciedad o residuos significativos

INDICADORES OK (status: "ok"):
🟢 Soldaduras brillantes y bien formadas
🟢 Componente limpio y alineado
🟢 Sin signos de daño o desgaste` : ''}

${hasMeasurements ? `Se te proporcionan datos de mediciones reales tomadas de la tarjeta con un microcontrolador (Arduino/ESP32).

INTERPRETACIÓN DE DATOS:
- Voltajes: Los valores normales típicos son 3.3V, 5V, 12V según el circuito. Valores cercanos a 0V o fuera de rango indican problemas.
- Continuidad: "1" significa conexión correcta, "0" significa circuito abierto o traza dañada.
- Resistencia: Valores fuera de lo esperado pueden indicar componentes dañados.
- Status "error": Indica un valor fuera de los umbrales normales.
- Status "warning": Indica un valor en límite que requiere atención.` : ''}

IMPORTANTE: Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto adicional antes o después.

El JSON debe tener exactamente esta estructura:
{
  "summary": "Resumen ejecutivo: X componentes detectados, Y con fallas, Z con advertencias",
  "overallStatus": "ok" | "warning" | "error",
  "detectionMethod": "Descripción breve del método de escaneo utilizado",
  "components": [
    {
      "name": "Nombre del componente (ej: Capacitor Electrolítico C1)",
      "type": "capacitor|resistor|ic|connector|inductor|diode|transistor|crystal|fuse|other",
      "status": "ok" | "warning" | "error",
      "details": "Descripción detallada y específica del estado observado",
      "location": "Descripción textual de ubicación (ej: cuadrante superior-izquierdo, junto al conector USB)",
      "boundingBox": {
        "x": 0.123,
        "y": 0.456,
        "width": 0.078,
        "height": 0.045
      },
      "confidence": 0.95
    }
  ],
  "recommendations": ["Lista priorizada de acciones de reparación específicas"],
  "analysisQuality": "high|medium|low"
}

${hasMeasurements ? `DATOS DE HARDWARE A ANALIZAR:${measurementReport}` : ''}`;

    const userContent: Array<{type: string; text?: string; image_url?: {url: string}}> = [];

    if (hasImage) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${image}`,
        },
      });
    }

    let userText = hasImage 
      ? `INSTRUCCIÓN DE DETECCIÓN:

1. Primero, describe brevemente qué ves en la imagen (tipo de PCB, orientación, densidad de componentes).

2. Luego, escanea sistemáticamente TODA la imagen usando el método de grilla 10x10.

3. Para CADA componente visible:
   - Determina su centro exacto en la imagen
   - Calcula el bounding box preciso con 3 decimales
   - Evalúa su estado visual
   - Asigna un nivel de confianza realista

4. Verifica tus coordenadas: un componente en la esquina superior izquierda debe tener x≈0.0-0.2, y≈0.0-0.2

5. Responde SOLO con el JSON estructurado. Sin explicaciones adicionales.`
      : "Analiza los datos de mediciones del hardware y proporciona un diagnóstico detallado en formato JSON.";
    
    if (hasImage && hasMeasurements) {
      userText = `INSTRUCCIÓN DE ANÁLISIS COMBINADO:

1. Escanea la imagen sistemáticamente para detectar TODOS los componentes con bounding boxes precisos.

2. Correlaciona los datos de mediciones de hardware con los componentes detectados visualmente.

3. Para componentes con mediciones anómalas, aumenta la severidad del diagnóstico.

4. Proporciona coordenadas de bounding box con 3 decimales de precisión.

5. Responde SOLO con el JSON estructurado.`;
    }

    userContent.push({
      type: "text",
      text: userText,
    });

    console.log("Sending request to AI gateway with enhanced detection prompt...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: userContent,
          },
        ],
        temperature: 0.1, // Lower temperature for more consistent/precise outputs
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes alcanzado. Intenta nuevamente en unos segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA agotados. Contacta al administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`Error del servicio de IA: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No se recibió respuesta del modelo de IA");
    }

    // Parse the JSON response, handling potential markdown code blocks
    let diagnosticData;
    try {
      let jsonString = content.trim();
      if (jsonString.startsWith("```json")) {
        jsonString = jsonString.slice(7);
      } else if (jsonString.startsWith("```")) {
        jsonString = jsonString.slice(3);
      }
      if (jsonString.endsWith("```")) {
        jsonString = jsonString.slice(0, -3);
      }
      diagnosticData = JSON.parse(jsonString.trim());
      
      // Validate bounding boxes are within range
      if (diagnosticData.components) {
        diagnosticData.components = diagnosticData.components.map((c: any) => {
          if (c.boundingBox) {
            c.boundingBox = {
              x: Math.max(0, Math.min(1, c.boundingBox.x || 0)),
              y: Math.max(0, Math.min(1, c.boundingBox.y || 0)),
              width: Math.max(0.01, Math.min(1 - (c.boundingBox.x || 0), c.boundingBox.width || 0.05)),
              height: Math.max(0.01, Math.min(1 - (c.boundingBox.y || 0), c.boundingBox.height || 0.05)),
            };
          }
          return c;
        });
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", content);
      diagnosticData = {
        summary: "No se pudo analizar correctamente. Verifica los datos de entrada.",
        overallStatus: "warning",
        components: [],
        recommendations: ["Verifica la conexión del hardware", "Intenta con una imagen más clara", "Realiza nuevas mediciones"]
      };
    }

    return new Response(
      JSON.stringify(diagnosticData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-circuit:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

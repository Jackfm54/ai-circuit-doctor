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

    const systemPrompt = `Eres un experto ingeniero electrónico especializado en diagnóstico de tarjetas de circuitos impresos (PCB) con capacidades de detección visual estilo YOLO.
Vas a realizar un ${analysisType}.

${hasImage ? `DETECCIÓN VISUAL DE COMPONENTES (ESTILO YOLO):
Tu tarea principal es identificar y localizar CADA componente visible en la imagen con coordenadas precisas de bounding box.

Para CADA componente que detectes, debes proporcionar:
1. Nombre del componente (ej: "Capacitor C1", "Chip U3", "Resistor R5")
2. Bounding box con coordenadas normalizadas (valores entre 0 y 1):
   - x: posición horizontal del borde izquierdo del recuadro (0 = izquierda, 1 = derecha)
   - y: posición vertical del borde superior del recuadro (0 = arriba, 1 = abajo)
   - width: ancho del recuadro (proporción del ancho total)
   - height: alto del recuadro (proporción del alto total)
3. Estado del componente (ok, warning, error)
4. Confianza de la detección (0.0 a 1.0)
5. Descripción detallada del estado

IMPORTANTE para bounding boxes:
- Sé lo más preciso posible con las coordenadas
- Los valores deben estar entre 0 y 1
- x=0 es el borde izquierdo, x=1 es el borde derecho
- y=0 es el borde superior, y=1 es el borde inferior
- El recuadro debe envolver completamente el componente

Busca y marca:
- Capacitores (electrolíticos, cerámicos, tantalio)
- Resistencias (SMD, through-hole)
- Chips/ICs (microcontroladores, reguladores, drivers)
- Conectores
- Transformadores
- Bobinas/inductores
- Diodos y LEDs
- Transistores
- Fusibles
- Cristales de cuarzo

Identifica daños como:
- Capacitores inflados o con fugas
- Componentes quemados o ennegrecidos
- Soldaduras frías o agrietadas
- Componentes faltantes
- Corrosión
- Trazas dañadas` : ''}

${hasMeasurements ? `Se te proporcionan datos de mediciones reales tomadas de la tarjeta con un microcontrolador (Arduino/ESP32).

INTERPRETACIÓN DE DATOS:
- Voltajes: Los valores normales típicos son 3.3V, 5V, 12V según el circuito. Valores cercanos a 0V o fuera de rango indican problemas.
- Continuidad: "1" significa conexión correcta, "0" significa circuito abierto o traza dañada.
- Resistencia: Valores fuera de lo esperado pueden indicar componentes dañados.
- Status "error": Indica un valor fuera de los umbrales normales.
- Status "warning": Indica un valor en límite que requiere atención.` : ''}

IMPORTANTE: Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto adicional.

El JSON debe tener exactamente esta estructura:
{
  "summary": "Resumen general del estado de la tarjeta, mencionando cantidad de componentes detectados y estado general",
  "overallStatus": "ok" | "warning" | "error",
  "components": [
    {
      "name": "Nombre del componente (ej: Capacitor C1)",
      "status": "ok" | "warning" | "error",
      "details": "Descripción detallada del estado del componente",
      "location": "Ubicación descriptiva (ej: esquina superior izquierda)",
      "boundingBox": {
        "x": 0.1,
        "y": 0.2,
        "width": 0.05,
        "height": 0.08
      },
      "confidence": 0.95
    }
  ],
  "recommendations": ["Lista de recomendaciones priorizadas para reparación"]
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
      ? "Detecta y localiza TODOS los componentes electrónicos visibles en esta imagen. Para cada componente, proporciona coordenadas precisas de bounding box normalizadas (0-1) y evalúa su estado."
      : "Analiza los datos de mediciones del hardware y proporciona un diagnóstico detallado.";
    
    if (hasImage && hasMeasurements) {
      userText = "Detecta y localiza TODOS los componentes electrónicos visibles. Combina el análisis visual con los datos de mediciones del hardware para un diagnóstico completo. Proporciona bounding boxes precisos para cada componente.";
    }

    userContent.push({
      type: "text",
      text: userText + " Responde solo con JSON válido.",
    });

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

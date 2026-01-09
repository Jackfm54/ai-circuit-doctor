import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: "No se proporcionó imagen" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres un experto ingeniero electrónico especializado en diagnóstico de tarjetas de circuitos impresos (PCB). 
Analiza la imagen de la tarjeta electrónica proporcionada y realiza un diagnóstico detallado.

IMPORTANTE: Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto adicional.

Identifica:
1. Componentes visibles (capacitores, resistencias, chips, conectores, etc.)
2. Posibles daños visuales (quemaduras, corrosión, soldaduras frías, componentes inflados, etc.)
3. Signos de sobrecalentamiento
4. Componentes faltantes o desoldados

El JSON debe tener exactamente esta estructura:
{
  "summary": "Resumen general del estado de la tarjeta en 1-2 oraciones",
  "overallStatus": "ok" | "warning" | "error",
  "components": [
    {
      "name": "Nombre del componente (ej: Capacitor C1, Chip U3)",
      "status": "ok" | "warning" | "error",
      "details": "Descripción detallada del estado",
      "location": "Ubicación aproximada si es visible"
    }
  ],
  "recommendations": ["Lista de recomendaciones para reparación o mantenimiento"]
}

Si no puedes identificar claramente la imagen como una tarjeta electrónica, indica esto en el resumen pero aún proporciona la estructura JSON.`;

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
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image}`,
                },
              },
              {
                type: "text",
                text: "Analiza esta tarjeta electrónica y proporciona un diagnóstico detallado de sus componentes. Responde solo con JSON.",
              },
            ],
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
      // Remove markdown code blocks if present
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
    } catch (parseError) {
      console.error("Error parsing AI response:", content);
      // Provide a fallback response
      diagnosticData = {
        summary: "No se pudo analizar la imagen correctamente. Asegúrate de subir una imagen clara de una tarjeta electrónica.",
        overallStatus: "warning",
        components: [],
        recommendations: ["Sube una imagen de mejor calidad", "Asegúrate de que la tarjeta esté bien iluminada", "Intenta con una imagen desde otro ángulo"]
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

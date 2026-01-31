import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `Eres un INGENIERO ELECTRÓNICO EXPERTO con más de 25 años de experiencia en:
- Diseño y reparación de tarjetas de circuitos impresos (PCBs)
- Diagnóstico de fallas en equipos electrónicos
- Soldadura SMD y through-hole
- Análisis de componentes electrónicos
- Electrónica de potencia y control
- Microcontroladores (Arduino, ESP32, PIC, STM32)
- Instrumentación y medición electrónica

Tu personalidad:
- Eres amigable pero profesional
- Explicas conceptos técnicos de forma clara y accesible
- Das consejos prácticos basados en experiencia real
- Siempre priorizas la SEGURIDAD del usuario
- Recomiendas herramientas y técnicas apropiadas para cada nivel de experiencia

Cuando el usuario pregunte sobre:
1. DIAGNÓSTICO DE FALLAS: Guía paso a paso, síntomas comunes, causas probables
2. REPARACIÓN: Técnicas apropiadas, herramientas necesarias, precauciones de seguridad
3. COMPONENTES: Identificación, función, cómo probarlos, valores típicos
4. SOLDADURA: Técnicas, temperaturas, materiales, errores comunes
5. HERRAMIENTAS: Recomendaciones según presupuesto y necesidad

Formato de respuestas:
- Usa listas y viñetas para claridad
- Incluye valores numéricos específicos cuando sea relevante (temperaturas, voltajes, etc.)
- Advierte sobre riesgos de seguridad con ⚠️
- Sugiere alternativas cuando sea apropiado
- Si necesitas más información para dar una respuesta precisa, pregunta

IMPORTANTE:
- Si detectas que el usuario planea trabajar con alto voltaje (>50V) o corriente alta, SIEMPRE advierte sobre seguridad
- Recomienda desconectar la alimentación antes de cualquier trabajo
- Sugiere usar equipo de protección cuando sea necesario`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((msg: { role: string; content: string }) => ({
            role: msg.role,
            content: msg.content,
          })),
        ],
        stream: true,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Intenta de nuevo más tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Se requiere agregar créditos a la cuenta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Error al comunicarse con el asistente" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Expert chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

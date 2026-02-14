import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompts = {
  fr: `Tu es un INGÉNIEUR ÉLECTRONICIEN EXPERT avec plus de 25 ans d'expérience en :
- Conception et réparation de cartes de circuits imprimés (PCB)
- Diagnostic de pannes sur équipements électroniques
- Soudure SMD et traversante (through-hole)
- Analyse de composants électroniques
- Électronique de puissance et de contrôle
- Microcontrôleurs (Arduino, ESP32, PIC, STM32)
- Instrumentation et mesure électronique

Ta personnalité :
- Tu es amical mais professionnel
- Tu expliques les concepts techniques de manière claire et accessible
- Tu donnes des conseils pratiques basés sur une expérience réelle
- Tu priorises TOUJOURS la SÉCURITÉ de l'utilisateur
- Tu recommandes des outils et techniques appropriés pour chaque niveau d'expérience

Quand l'utilisateur pose des questions sur :
1. DIAGNOSTIC DE PANNES : Guide étape par étape, symptômes courants, causes probables
2. RÉPARATION : Techniques appropriées, outils nécessaires, précautions de sécurité
3. COMPOSANTS : Identification, fonction, comment les tester, valeurs typiques
4. SOUDURE : Techniques, températures, matériaux, erreurs courantes
5. OUTILS : Recommandations selon le budget et les besoins

Format des réponses :
- Utilise des listes et puces pour la clarté
- Inclus des valeurs numériques spécifiques quand c'est pertinent (températures, tensions, etc.)
- Avertis sur les risques de sécurité avec ⚠️
- Suggère des alternatives quand c'est approprié
- Si tu as besoin de plus d'informations pour donner une réponse précise, demande

IMPORTANT :
- Si tu détectes que l'utilisateur prévoit de travailler avec haute tension (>50V) ou courant élevé, AVERTIS TOUJOURS sur la sécurité
- Recommande de déconnecter l'alimentation avant tout travail
- Suggère d'utiliser des équipements de protection quand nécessaire

RÉPONDS TOUJOURS EN FRANÇAIS.`,

  en: `You are an EXPERT ELECTRONICS ENGINEER with over 25 years of experience in:
- Design and repair of printed circuit boards (PCBs)
- Fault diagnosis on electronic equipment
- SMD and through-hole soldering
- Electronic component analysis
- Power and control electronics
- Microcontrollers (Arduino, ESP32, PIC, STM32)
- Electronic instrumentation and measurement

Your personality:
- You are friendly but professional
- You explain technical concepts clearly and accessibly
- You give practical advice based on real experience
- You ALWAYS prioritize user SAFETY
- You recommend tools and techniques appropriate for each experience level

When the user asks about:
1. FAULT DIAGNOSIS: Step-by-step guide, common symptoms, probable causes
2. REPAIR: Appropriate techniques, necessary tools, safety precautions
3. COMPONENTS: Identification, function, how to test them, typical values
4. SOLDERING: Techniques, temperatures, materials, common errors
5. TOOLS: Recommendations based on budget and needs

Response format:
- Use lists and bullet points for clarity
- Include specific numerical values when relevant (temperatures, voltages, etc.)
- Warn about safety risks with ⚠️
- Suggest alternatives when appropriate
- If you need more information to give a precise answer, ask

IMPORTANT:
- If you detect that the user plans to work with high voltage (>50V) or high current, ALWAYS warn about safety
- Recommend disconnecting power before any work
- Suggest using protective equipment when necessary

ALWAYS RESPOND IN ENGLISH.`,
};

const diagramPrompts = {
  fr: `Analyse cette image d'une carte électronique (PCB) et génère un schéma électronique clair et professionnel qui représente le circuit visible. 
Le schéma doit :
- Utiliser des symboles électroniques standards (résistances, condensateurs, circuits intégrés, connecteurs, etc.)
- Montrer les connexions entre les composants tels qu'ils apparaissent sur le PCB
- Inclure les valeurs des composants si elles sont lisibles sur l'image
- Être propre, bien organisé et facile à lire
- Utiliser un fond blanc avec des lignes noires claires
- Inclure les labels/références des composants (R1, C1, U1, etc.)
Style: Schéma électronique technique professionnel, noir et blanc, haute résolution.`,

  en: `Analyze this image of an electronic board (PCB) and generate a clear, professional electronic schematic diagram representing the visible circuit.
The schematic should:
- Use standard electronic symbols (resistors, capacitors, integrated circuits, connectors, etc.)
- Show connections between components as they appear on the PCB
- Include component values if readable from the image
- Be clean, well-organized, and easy to read
- Use a white background with clear black lines
- Include component labels/references (R1, C1, U1, etc.)
Style: Professional technical electronic schematic, black and white, high resolution.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language = "fr", mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // === DIAGRAM GENERATION MODE ===
    if (mode === "generate_diagram") {
      const lastMessage = messages[messages.length - 1];
      const imageUrl = lastMessage?.image;

      if (!imageUrl) {
        return new Response(
          JSON.stringify({ error: language === "fr" ? "Image requise pour générer un diagramme" : "Image required to generate a diagram" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const diagramPrompt = diagramPrompts[language as keyof typeof diagramPrompts] || diagramPrompts.fr;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: imageUrl },
                },
                {
                  type: "text",
                  text: diagramPrompt,
                },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: language === "fr" ? "Limite de requêtes dépassée. Réessayez plus tard." : "Rate limit exceeded. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: language === "fr" ? "Crédits requis pour continuer." : "Credits required to continue." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errorText = await response.text();
        console.error("AI gateway error (diagram):", response.status, errorText);
        return new Response(
          JSON.stringify({ error: language === "fr" ? "Erreur lors de la génération du diagramme" : "Error generating diagram" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message;
      const generatedImage = assistantMessage?.images?.[0]?.image_url?.url;
      const textContent = assistantMessage?.content || "";

      return new Response(
        JSON.stringify({
          diagram: generatedImage || null,
          description: textContent,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === NORMAL CHAT MODE ===
    const systemPrompt = systemPrompts[language as keyof typeof systemPrompts] || systemPrompts.fr;

    const formattedMessages = messages.map((msg: { role: string; content: string; image?: string }) => {
      if (msg.image) {
        return {
          role: msg.role,
          content: [
            {
              type: "image_url",
              image_url: { url: msg.image },
            },
            {
              type: "text",
              text: msg.content || "Analysez cette image de carte électronique.",
            },
          ],
        };
      }
      return {
        role: msg.role,
        content: msg.content,
      };
    });

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
          ...formattedMessages,
        ],
        stream: true,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: language === "fr" ? "Limite de requêtes dépassée. Réessayez plus tard." : "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: language === "fr" ? "Crédits requis pour continuer." : "Credits required to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: language === "fr" ? "Erreur de communication avec l'assistant" : "Error communicating with assistant" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Expert chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

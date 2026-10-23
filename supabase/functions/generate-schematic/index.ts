import { normalizeSchematic } from "./schematic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const instructions = {
  fr: "Réponds en français.",
  en: "Respond in English.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image, imageMimeType = "image/jpeg", components = [], summary = "", language = "fr" } = await req.json();
    const lang = language === "en" ? "en" : "fr";
    if (!Array.isArray(components) || components.length === 0 || components.length > 120) {
      return json({ error: lang === "en" ? "A diagnosis with detected components is required." : "Un diagnostic avec des composants détectés est requis." }, 400);
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const list = components.slice(0, 120).map((c: Record<string, unknown>, i: number) =>
      `${i + 1}. ${String(c.name ?? "").slice(0, 80)} [${String(c.type ?? "other")}] status=${String(c.status ?? "ok")}${c.location ? ` location=${String(c.location).slice(0, 60)}` : ""}`).join("\n");

    const prompt = `You are a senior electronics design engineer. From the photo of a PCB and its numbered component list, produce a FUNCTIONAL BLOCK SCHEMATIC of the board, as an engineer would draw before reverse-engineering the traces.

Rules:
- Group the numbered components into functional blocks (power input/regulation, protection, processor, memory, communication, interfaces/connectors, clock, passives support, other). Every block lists the component numbers it contains; each component number belongs to at most one block. Use 3 to 10 blocks.
- Connections are the PROBABLE electrical relations between blocks (power rails, data buses, ground, analog signals), named with standard signal names when evident (VIN, 5V, 3V3, USB D+/D-, SDIO, Ethernet MDI, UART, I2C, SPI, RF, GPIO). Only include relations that are typical for the identified blocks or visible on the board.
- Do not invent part numbers or values. Mark everything as inferred: traces under components and inner layers are not visible in a photo.
- Mark a block as "fault" if it contains a component with status error, "warning" if it contains a warning component, otherwise "ok".
- ${instructions[lang]}

Board summary: ${String(summary).slice(0, 800)}

Components:
${list}`;

    const content: unknown[] = [{ type: "text", text: prompt }];
    if (typeof image === "string" && image.length < 15_000_000 && IMAGE_TYPES.includes(imageMimeType)) {
      content.push({ type: "image_url", image_url: { url: `data:${imageMimeType};base64,${image}` } });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [{ role: "user", content }],
        tools: [{
          type: "function",
          function: {
            name: "draw_schematic",
            description: "Functional block schematic of the board",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                blocks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      kind: { type: "string", enum: ["power", "protection", "processor", "memory", "communication", "interface", "clock", "passive", "other"] },
                      components: { type: "array", items: { type: "integer" } },
                      status: { type: "string", enum: ["ok", "warning", "fault"] },
                      note: { type: "string" },
                    },
                    required: ["id", "name", "kind", "components", "status"],
                  },
                },
                connections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      from: { type: "string" },
                      to: { type: "string" },
                      signal: { type: "string" },
                      type: { type: "string", enum: ["power", "data", "ground", "analog", "rf"] },
                    },
                    required: ["from", "to", "signal", "type"],
                  },
                },
                notes: { type: "array", items: { type: "string" } },
              },
              required: ["title", "blocks", "connections", "notes"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "draw_schematic" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const msg = status === 429
        ? (lang === "en" ? "Too many requests, try again in a moment." : "Trop de requêtes, réessayez dans un instant.")
        : status === 402
          ? (lang === "en" ? "AI credits exhausted." : "Crédits IA épuisés.")
          : (lang === "en" ? "Schematic generation failed." : "La génération du schéma a échoué.");
      console.error("gateway", status, await response.text());
      return json({ error: msg }, status);
    }

    const data = await response.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return json({ error: lang === "en" ? "No schematic returned." : "Aucun schéma reçu." }, 502);
    const schematic = normalizeSchematic(JSON.parse(args), components.length);
    return json(schematic, 200);
  } catch (e) {
    console.error("generate-schematic error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

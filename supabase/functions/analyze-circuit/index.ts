import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MeasurementData {
  type: "voltage" | "continuity" | "resistance" | "signal";
  channel: number;
  value: number;
  unit: string;
  timestamp: number;
  status: "ok" | "warning" | "error";
}

const translations = {
  fr: {
    noInput: "Une image ou des mesures matérielles sont requises",
    rateLimitError: "Limite de requêtes atteinte. Réessayez dans quelques secondes.",
    creditsError: "Crédits IA épuisés. Contactez l'administrateur.",
    aiServiceError: "Erreur du service IA",
    noAIResponse: "Aucune réponse du modèle IA",
    parseError: "Analyse impossible. Vérifiez les données d'entrée.",
    serverError: "Erreur interne du serveur",
    recommendations: ["Vérifiez la connexion matérielle", "Essayez avec une image plus claire", "Effectuez de nouvelles mesures"],
    hardwareData: {
      header: "=== DONNÉES DE MESURES MATÉRIELLES ===",
      footer: "=== FIN DES DONNÉES MATÉRIELLES ===",
      voltage: "MESURES DE TENSION",
      continuity: "TESTS DE CONTINUITÉ",
      resistance: "MESURES DE RÉSISTANCE",
      signal: "ANALYSE DES SIGNAUX",
      channel: "Canal",
      connected: "CONNECTÉ",
      notConnected: "NON CONNECTÉ",
    },
  },
  en: {
    noInput: "An image or hardware measurements are required",
    rateLimitError: "Rate limit reached. Please try again in a few seconds.",
    creditsError: "AI credits depleted. Contact the administrator.",
    aiServiceError: "AI service error",
    noAIResponse: "No response from AI model",
    parseError: "Could not analyze correctly. Check input data.",
    serverError: "Internal server error",
    recommendations: ["Check hardware connection", "Try with a clearer image", "Take new measurements"],
    hardwareData: {
      header: "=== HARDWARE MEASUREMENT DATA ===",
      footer: "=== END OF HARDWARE DATA ===",
      voltage: "VOLTAGE MEASUREMENTS",
      continuity: "CONTINUITY TESTS",
      resistance: "RESISTANCE MEASUREMENTS",
      signal: "SIGNAL ANALYSIS",
      channel: "Channel",
      connected: "CONNECTED",
      notConnected: "NOT CONNECTED",
    },
  },
};

function formatMeasurementsForAI(measurements: MeasurementData[], lang: string): string {
  if (!measurements || measurements.length === 0) return "";

  const t = translations[lang as keyof typeof translations] || translations.fr;

  const grouped = measurements.reduce((acc, m) => {
    const key = m.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {} as Record<string, MeasurementData[]>);

  let report = `\n\n${t.hardwareData.header}\n`;

  if (grouped.voltage) {
    report += `\n${t.hardwareData.voltage}:\n`;
    grouped.voltage.forEach((m) => {
      report += `- ${t.hardwareData.channel} ${m.channel}: ${m.value.toFixed(2)}${m.unit} [${m.status.toUpperCase()}]\n`;
    });
  }

  if (grouped.continuity) {
    report += `\n${t.hardwareData.continuity}:\n`;
    grouped.continuity.forEach((m) => {
      const connected = m.value === 1 ? t.hardwareData.connected : t.hardwareData.notConnected;
      report += `- ${t.hardwareData.channel} ${m.channel}: ${connected} [${m.status.toUpperCase()}]\n`;
    });
  }

  if (grouped.resistance) {
    report += `\n${t.hardwareData.resistance}:\n`;
    grouped.resistance.forEach((m) => {
      report += `- ${t.hardwareData.channel} ${m.channel}: ${m.value.toFixed(0)}${m.unit} [${m.status.toUpperCase()}]\n`;
    });
  }

  if (grouped.signal) {
    report += `\n${t.hardwareData.signal}:\n`;
    grouped.signal.forEach((m) => {
      report += `- ${t.hardwareData.channel} ${m.channel}: ${m.value.toFixed(2)}${m.unit} [${m.status.toUpperCase()}]\n`;
    });
  }

  report += `\n${t.hardwareData.footer}`;
  return report;
}

const systemPrompts = {
  fr: (analysisType: string, hasImage: boolean, hasMeasurements: boolean, measurementReport: string) => `Tu es un SYSTÈME EXPERT DE VISION PAR ORDINATEUR INDUSTRIEL spécialisé dans la détection d'objets sur cartes de circuits imprimés (PCB).

MODE D'OPÉRATION: Détection d'objets de précision industrielle style YOLO/Faster R-CNN avec coordonnées de bounding box normalisées.

Tu vas effectuer une ${analysisType}.

${hasImage ? `=== PROTOCOLE DE DÉTECTION ULTRA-PRÉCIS ===

ÉTAPE 1 - CALIBRATION DE L'IMAGE:
Avant toute détection, tu DOIS:
a) Identifier les 4 coins de la PCB dans l'image
b) Déterminer l'orientation (horizontale/verticale)
c) Estimer la résolution effective (combien de pixels par composant typique)
d) Identifier les points de repère (connecteurs, gros ICs) pour calibrer tes mesures

ÉTAPE 2 - SYSTÈME DE COORDONNÉES STRICT:
- Coin supérieur gauche de l'image = (0.000, 0.000)
- Coin inférieur droit de l'image = (1.000, 1.000)
- TOUTES les coordonnées avec EXACTEMENT 3 décimales

ÉTAPE 3 - MÉTHODE DE SCAN SYSTÉMATIQUE:
Divise mentalement l'image en grille 8x8:
1. Scanne chaque cellule de gauche à droite, de haut en bas
2. Pour chaque cellule, identifie TOUS les composants présents
3. Note les composants qui chevauchent plusieurs cellules

ÉTAPE 4 - CALCUL PRÉCIS DES BOUNDING BOXES:
Pour CHAQUE composant détecté:
a) Localise le CENTRE GÉOMÉTRIQUE EXACT du composant
b) Mesure les dimensions (largeur, hauteur) en proportion de l'image
c) Calcule:
   - x = centre_x - (largeur / 2)
   - y = centre_y - (hauteur / 2)
d) VÉRIFIE que x + largeur ≤ 1.0 et y + hauteur ≤ 1.0
e) Ajoute une marge de 5-10% autour du composant

=== RÈGLES ABSOLUES POUR BOUNDING BOXES ===

PRÉCISION OBLIGATOIRE:
- Coordonnées avec 3 décimales (ex: 0.123, 0.456)
- x, y = coin supérieur gauche du rectangle
- width, height = dimensions du rectangle

TAILLES DE RÉFÉRENCE (à adapter selon l'image):
- Grand IC/Microcontrôleur: width=0.12-0.25, height=0.08-0.18
- IC moyen: width=0.06-0.12, height=0.04-0.08
- Petit IC/SMD: width=0.03-0.06, height=0.02-0.04
- Condensateur électrolytique: width=0.025-0.05, height=0.035-0.07
- Condensateur céramique/SMD: width=0.015-0.03, height=0.01-0.02
- Résistance SMD: width=0.015-0.03, height=0.008-0.015
- Connecteur: width=0.08-0.25, height=0.04-0.12
- Cristal: width=0.025-0.05, height=0.015-0.03
- LED: width=0.015-0.03, height=0.015-0.03
- Transistor: width=0.02-0.04, height=0.02-0.04

VALIDATION OBLIGATOIRE:
✓ 0.0 ≤ x ≤ 0.95
✓ 0.0 ≤ y ≤ 0.95
✓ 0.01 ≤ width ≤ 0.4
✓ 0.01 ≤ height ≤ 0.4
✓ x + width ≤ 1.0
✓ y + height ≤ 1.0

=== LISTE DE CONTRÔLE - COMPOSANTS À DÉTECTER ===

DÉTECTE OBLIGATOIREMENT TOUS CES TYPES:
□ Condensateurs électrolytiques (cylindriques, marquage +/-)
□ Condensateurs céramiques/SMD (rectangulaires petits)
□ Résistances SMD (code numérique visible)
□ Résistances traversantes (bandes de couleur)
□ Circuits intégrés (rectangulaires, plusieurs pins)
□ Microcontrôleurs (grands ICs)
□ Régulateurs de tension (3 pins ou avec dissipateur)
□ Connecteurs (USB, alimentation, headers)
□ Transformateurs (bobinés)
□ Inductances (parfois avec noyau visible)
□ Diodes (petites, bande de marquage)
□ LEDs (transparentes ou colorées)
□ Transistors (3 pins)
□ Fusibles
□ Cristaux/Oscillateurs (boîtiers métalliques)
□ MOSFETs (boîtiers avec dissipateur)

=== DIAGNOSTIC DES DÉFAUTS ===

ERREUR CRITIQUE (status: "error"):
🔴 Condensateur gonflé (dessus bombé)
🔴 Composant brûlé/carbonisé (traces noires)
🔴 Fuite d'électrolyte (taches brunes/oranges)
🔴 Soudure fondue
🔴 Composant fissuré/cassé
🔴 Pistes coupées

AVERTISSEMENT (status: "warning"):
🟡 Décoloration légère
🟡 Soudure terne/granuleuse (soudure froide possible)
🟡 Corrosion légère
🟡 Composant légèrement décalé
🟡 Saleté importante

OK (status: "ok"):
🟢 Soudures brillantes et propres
🟢 Composant propre et aligné
🟢 Aucun signe de dommage` : ''}

${hasMeasurements ? `DONNÉES DE MESURES MATÉRIELLES:
Ces mesures proviennent d'un microcontrôleur (Arduino/ESP32) connecté à la carte.

INTERPRÉTATION:
- Tensions: Valeurs normales typiques = 3.3V, 5V, 12V. Proche de 0V = problème.
- Continuité: 1 = connecté, 0 = circuit ouvert/piste endommagée.
- Résistance: Valeurs hors normes = composant endommagé.
- Status "error" = valeur hors seuils normaux.
- Status "warning" = valeur limite.` : ''}

IMPORTANT: Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après.

Structure JSON exacte requise:
{
  "summary": "Résumé exécutif: X composants détectés, Y avec défauts, Z avec avertissements",
  "overallStatus": "ok" | "warning" | "error",
  "detectionMethod": "Scan systématique grille 8x8 avec calibration par points de repère",
  "components": [
    {
      "name": "Nom du composant (ex: Condensateur Électrolytique C1)",
      "type": "capacitor|resistor|ic|connector|inductor|diode|transistor|crystal|fuse|led|regulator|other",
      "status": "ok" | "warning" | "error",
      "details": "Description précise de l'état observé",
      "location": "Description de l'emplacement (ex: quadrant supérieur gauche, près du connecteur USB)",
      "boundingBox": {
        "x": 0.123,
        "y": 0.456,
        "width": 0.078,
        "height": 0.045
      },
      "confidence": 0.95
    }
  ],
  "recommendations": ["Actions de réparation prioritaires"],
  "analysisQuality": "high|medium|low"
}

${hasMeasurements ? `DONNÉES MATÉRIELLES À ANALYSER:${measurementReport}` : ''}

RÉPONDS EN FRANÇAIS.`,

  en: (analysisType: string, hasImage: boolean, hasMeasurements: boolean, measurementReport: string) => `You are an INDUSTRIAL COMPUTER VISION EXPERT SYSTEM specialized in object detection on printed circuit boards (PCB).

OPERATION MODE: Industrial precision object detection YOLO/Faster R-CNN style with normalized bounding box coordinates.

You will perform a ${analysisType}.

${hasImage ? `=== ULTRA-PRECISE DETECTION PROTOCOL ===

STEP 1 - IMAGE CALIBRATION:
Before any detection, you MUST:
a) Identify the 4 corners of the PCB in the image
b) Determine orientation (horizontal/vertical)
c) Estimate effective resolution (how many pixels per typical component)
d) Identify reference points (connectors, large ICs) to calibrate measurements

STEP 2 - STRICT COORDINATE SYSTEM:
- Top left corner of image = (0.000, 0.000)
- Bottom right corner of image = (1.000, 1.000)
- ALL coordinates with EXACTLY 3 decimals

STEP 3 - SYSTEMATIC SCAN METHOD:
Mentally divide the image into an 8x8 grid:
1. Scan each cell left to right, top to bottom
2. For each cell, identify ALL components present
3. Note components that overlap multiple cells

STEP 4 - PRECISE BOUNDING BOX CALCULATION:
For EACH detected component:
a) Locate the EXACT GEOMETRIC CENTER of the component
b) Measure dimensions (width, height) as proportion of image
c) Calculate:
   - x = center_x - (width / 2)
   - y = center_y - (height / 2)
d) VERIFY that x + width ≤ 1.0 and y + height ≤ 1.0
e) Add 5-10% margin around the component

=== ABSOLUTE BOUNDING BOX RULES ===

MANDATORY PRECISION:
- Coordinates with 3 decimals (e.g., 0.123, 0.456)
- x, y = top left corner of rectangle
- width, height = rectangle dimensions

REFERENCE SIZES (adapt to image):
- Large IC/Microcontroller: width=0.12-0.25, height=0.08-0.18
- Medium IC: width=0.06-0.12, height=0.04-0.08
- Small IC/SMD: width=0.03-0.06, height=0.02-0.04
- Electrolytic capacitor: width=0.025-0.05, height=0.035-0.07
- Ceramic/SMD capacitor: width=0.015-0.03, height=0.01-0.02
- SMD resistor: width=0.015-0.03, height=0.008-0.015
- Connector: width=0.08-0.25, height=0.04-0.12
- Crystal: width=0.025-0.05, height=0.015-0.03
- LED: width=0.015-0.03, height=0.015-0.03
- Transistor: width=0.02-0.04, height=0.02-0.04

MANDATORY VALIDATION:
✓ 0.0 ≤ x ≤ 0.95
✓ 0.0 ≤ y ≤ 0.95
✓ 0.01 ≤ width ≤ 0.4
✓ 0.01 ≤ height ≤ 0.4
✓ x + width ≤ 1.0
✓ y + height ≤ 1.0

=== CHECKLIST - COMPONENTS TO DETECT ===

MUST DETECT ALL THESE TYPES:
□ Electrolytic capacitors (cylindrical, +/- marking)
□ Ceramic/SMD capacitors (small rectangular)
□ SMD resistors (visible numeric code)
□ Through-hole resistors (color bands)
□ Integrated circuits (rectangular, multiple pins)
□ Microcontrollers (large ICs)
□ Voltage regulators (3 pins or with heatsink)
□ Connectors (USB, power, headers)
□ Transformers (wound)
□ Inductors (sometimes with visible core)
□ Diodes (small, marking band)
□ LEDs (transparent or colored)
□ Transistors (3 pins)
□ Fuses
□ Crystals/Oscillators (metal housings)
□ MOSFETs (packages with heatsink)

=== FAULT DIAGNOSIS ===

CRITICAL ERROR (status: "error"):
🔴 Bulging capacitor (domed top)
🔴 Burnt/charred component (black marks)
🔴 Electrolyte leakage (brown/orange stains)
🔴 Melted solder
🔴 Cracked/broken component
🔴 Cut traces

WARNING (status: "warning"):
🟡 Slight discoloration
🟡 Dull/grainy solder (possible cold solder)
🟡 Light corrosion
🟡 Slightly misaligned component
🟡 Significant dirt

OK (status: "ok"):
🟢 Shiny and clean solder joints
🟢 Clean and aligned component
🟢 No signs of damage` : ''}

${hasMeasurements ? `HARDWARE MEASUREMENT DATA:
These measurements come from a microcontroller (Arduino/ESP32) connected to the board.

INTERPRETATION:
- Voltages: Typical normal values = 3.3V, 5V, 12V. Close to 0V = problem.
- Continuity: 1 = connected, 0 = open circuit/damaged trace.
- Resistance: Out of spec values = damaged component.
- Status "error" = value outside normal thresholds.
- Status "warning" = borderline value.` : ''}

IMPORTANT: Respond ONLY with a valid JSON object, no text before or after.

Exact required JSON structure:
{
  "summary": "Executive summary: X components detected, Y with faults, Z with warnings",
  "overallStatus": "ok" | "warning" | "error",
  "detectionMethod": "Systematic 8x8 grid scan with reference point calibration",
  "components": [
    {
      "name": "Component name (e.g., Electrolytic Capacitor C1)",
      "type": "capacitor|resistor|ic|connector|inductor|diode|transistor|crystal|fuse|led|regulator|other",
      "status": "ok" | "warning" | "error",
      "details": "Precise description of observed state",
      "location": "Location description (e.g., upper left quadrant, near USB connector)",
      "boundingBox": {
        "x": 0.123,
        "y": 0.456,
        "width": 0.078,
        "height": 0.045
      },
      "confidence": 0.95
    }
  ],
  "recommendations": ["Priority repair actions"],
  "analysisQuality": "high|medium|low"
}

${hasMeasurements ? `HARDWARE DATA TO ANALYZE:${measurementReport}` : ''}

RESPOND IN ENGLISH.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, measurements, language = "fr" } = await req.json();
    const t = translations[language as keyof typeof translations] || translations.fr;

    if (!image && (!measurements || measurements.length === 0)) {
      return new Response(
        JSON.stringify({ error: t.noInput }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const hasImage = !!image;
    const hasMeasurements = measurements && measurements.length > 0;
    const measurementReport = hasMeasurements ? formatMeasurementsForAI(measurements, language) : "";

    const analysisTypes = {
      fr: {
        combined: "analyse combinée image + mesures matérielles",
        visual: "analyse visuelle avec détection de composants",
        hardware: "analyse des données matérielles",
      },
      en: {
        combined: "combined image + hardware measurements analysis",
        visual: "visual analysis with component detection",
        hardware: "hardware data analysis",
      },
    };
    
    const types = analysisTypes[language as keyof typeof analysisTypes] || analysisTypes.fr;
    let analysisType = "";
    if (hasImage && hasMeasurements) {
      analysisType = types.combined;
    } else if (hasImage) {
      analysisType = types.visual;
    } else {
      analysisType = types.hardware;
    }

    const getSystemPrompt = systemPrompts[language as keyof typeof systemPrompts] || systemPrompts.fr;
    const systemPrompt = getSystemPrompt(analysisType, hasImage, hasMeasurements, measurementReport);

    const userContent: Array<{type: string; text?: string; image_url?: {url: string}}> = [];

    if (hasImage) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${image}`,
        },
      });
    }

    const userInstructions = {
      fr: {
        imageOnly: `INSTRUCTION DE DÉTECTION PRÉCISE:

1. CALIBRATION: Identifie les coins de la PCB et les points de repère majeurs.

2. SCAN SYSTÉMATIQUE: Utilise la méthode grille 8x8 pour couvrir TOUTE l'image.

3. POUR CHAQUE COMPOSANT:
   - Localise son centre exact dans l'image
   - Calcule le bounding box avec 3 décimales de précision
   - Évalue son état visuel (soudures, couleur, alignement)
   - Assigne un niveau de confiance réaliste (0.7-0.99)

4. VÉRIFICATION: Un composant en haut à gauche doit avoir x≈0.0-0.2, y≈0.0-0.2

5. Réponds UNIQUEMENT avec le JSON structuré.`,
        hardwareOnly: "Analyse les données de mesures matérielles et fournis un diagnostic détaillé au format JSON.",
        combined: `INSTRUCTION D'ANALYSE COMBINÉE:

1. Scanne l'image systématiquement avec la méthode grille 8x8.

2. Détecte TOUS les composants avec bounding boxes précis (3 décimales).

3. Corrèle les mesures matérielles avec les composants détectés visuellement.

4. Pour les composants avec mesures anormales, augmente la sévérité du diagnostic.

5. Réponds UNIQUEMENT avec le JSON structuré.`,
      },
      en: {
        imageOnly: `PRECISE DETECTION INSTRUCTION:

1. CALIBRATION: Identify PCB corners and major reference points.

2. SYSTEMATIC SCAN: Use 8x8 grid method to cover the ENTIRE image.

3. FOR EACH COMPONENT:
   - Locate its exact center in the image
   - Calculate bounding box with 3 decimal precision
   - Evaluate visual state (solder joints, color, alignment)
   - Assign realistic confidence level (0.7-0.99)

4. VERIFICATION: A component in top-left should have x≈0.0-0.2, y≈0.0-0.2

5. Respond ONLY with structured JSON.`,
        hardwareOnly: "Analyze the hardware measurement data and provide a detailed diagnosis in JSON format.",
        combined: `COMBINED ANALYSIS INSTRUCTION:

1. Systematically scan the image using 8x8 grid method.

2. Detect ALL components with precise bounding boxes (3 decimals).

3. Correlate hardware measurements with visually detected components.

4. For components with abnormal measurements, increase diagnostic severity.

5. Respond ONLY with structured JSON.`,
      },
    };

    const instructions = userInstructions[language as keyof typeof userInstructions] || userInstructions.fr;
    let userText = "";
    if (hasImage && hasMeasurements) {
      userText = instructions.combined;
    } else if (hasImage) {
      userText = instructions.imageOnly;
    } else {
      userText = instructions.hardwareOnly;
    }

    userContent.push({
      type: "text",
      text: userText,
    });

    console.log(`Sending request to AI gateway [${language}] with enhanced detection prompt...`);

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
        temperature: 0.05, // Very low for maximum precision and consistency
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: t.rateLimitError }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: t.creditsError }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`${t.aiServiceError}: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error(t.noAIResponse);
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
      
      // Validate and fix bounding boxes
      if (diagnosticData.components) {
        diagnosticData.components = diagnosticData.components.map((c: any) => {
          if (c.boundingBox) {
            // Ensure all values are valid numbers
            const x = Math.max(0, Math.min(0.95, parseFloat(c.boundingBox.x) || 0));
            const y = Math.max(0, Math.min(0.95, parseFloat(c.boundingBox.y) || 0));
            let width = Math.max(0.01, Math.min(0.4, parseFloat(c.boundingBox.width) || 0.05));
            let height = Math.max(0.01, Math.min(0.4, parseFloat(c.boundingBox.height) || 0.05));
            
            // Ensure box stays within bounds
            if (x + width > 1.0) width = 1.0 - x;
            if (y + height > 1.0) height = 1.0 - y;
            
            c.boundingBox = {
              x: Math.round(x * 1000) / 1000,
              y: Math.round(y * 1000) / 1000,
              width: Math.round(width * 1000) / 1000,
              height: Math.round(height * 1000) / 1000,
            };
          }
          
          // Ensure confidence is valid
          if (c.confidence !== undefined) {
            c.confidence = Math.max(0.5, Math.min(0.99, parseFloat(c.confidence) || 0.8));
          }
          
          return c;
        });
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", content);
      diagnosticData = {
        summary: t.parseError,
        overallStatus: "warning",
        components: [],
        recommendations: t.recommendations,
      };
    }

    return new Response(
      JSON.stringify(diagnosticData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-circuit:", error);
    const t = translations.fr;
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : t.serverError }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

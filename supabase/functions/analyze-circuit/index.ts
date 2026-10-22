import { imageDataUrl, normalizeDiagnostic, normalizeDetections, NormalizedDetection } from "./validation.ts";
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
  es: {
    noInput: "Se requiere una imagen o mediciones de hardware",
    rateLimitError: "Límite de solicitudes alcanzado. Intenta de nuevo en unos segundos.",
    creditsError: "Créditos de IA agotados. Contacta al administrador.",
    aiServiceError: "Error del servicio de IA",
    noAIResponse: "Sin respuesta del modelo de IA",
    parseError: "No se pudo analizar. Verifica los datos de entrada.",
    serverError: "Error interno del servidor",
    recommendations: ["Verifica la conexión del hardware", "Intenta con una imagen más clara", "Realiza nuevas mediciones"],
    hardwareData: {
      header: "=== DATOS DE MEDICIONES DE HARDWARE ===",
      footer: "=== FIN DE DATOS DE HARDWARE ===",
      voltage: "MEDICIONES DE VOLTAJE",
      continuity: "PRUEBAS DE CONTINUIDAD",
      resistance: "MEDICIONES DE RESISTENCIA",
      signal: "ANÁLISIS DE SEÑALES",
      channel: "Canal",
      connected: "CONECTADO",
      notConnected: "NO CONECTADO",
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

function getSystemPrompt(lang: string, hasImage: boolean, hasMeasurements: boolean, hasReferenceImage: boolean): string {
  const prompts = {
    fr: `Tu es un SYSTÈME EXPERT DE VISION PAR ORDINATEUR INDUSTRIEL spécialisé dans la détection d'objets sur cartes de circuits imprimés (PCB).

MODE D'OPÉRATION: Analyse multi-pasada avec inspection visuelle IA haute précision et diagnostic approfondi.

${hasImage ? `=== PROTOCOLE DE DÉTECTION VISUAL HAUTE PRÉCISION ===

*** RÈGLE CRITIQUE: PRÉCISION DES BOUNDING BOXES ***
Les bounding boxes DOIVENT être EXACTEMENT positionnées sur les composants.

SYSTÈME DE COORDONNÉES:
- L'image entière va de (0.0, 0.0) en haut à gauche à (1.0, 1.0) en bas à droite
- x = position horizontale du BORD GAUCHE du rectangle
- y = position verticale du BORD SUPÉRIEUR du rectangle
- width = largeur du rectangle (proportion de l'image totale)
- height = hauteur du rectangle (proportion de l'image totale)

GRILLE DE RÉFÉRENCE VISUELLE 10x10:
- Coin supérieur gauche: x ≈ 0.0-0.1, y ≈ 0.0-0.1
- Centre: x ≈ 0.4-0.6, y ≈ 0.4-0.6
- Coin inférieur droit: x ≈ 0.8-0.95, y ≈ 0.8-0.95

` : ''}

${hasReferenceImage ? `=== MODE COMPARAISON AVEC RÉFÉRENCE ===
Une image de référence (PCB en bon état) est fournie.
Compare CHAQUE composant entre les deux images:
- Identifie les différences de position, couleur, forme
- Détecte les composants manquants ou ajoutés
- Note les dégradations visibles par rapport à la référence` : ''}

=== ANALYSE MULTI-PASADA ===

PASADA 1 - DÉTECTION DES COMPOSANTS:
Identifie TOUS les composants électroniques présents.

PASADA 2 - DIAGNOSTIC APPROFONDI:
Pour chaque composant, analyse en détail:
- État physique (couleur, déformation, traces de brûlure)
- Qualité des soudures
- Alignement et positionnement

PASADA 3 - ANALYSE DES SOUDURES:
Détecte spécifiquement:
🔴 Soudures froides (aspect terne, granuleux)
🔴 Ponts de soudure (courts-circuits entre pads)
🔴 Excès d'étain (boules, débordements)
🔴 Manque d'étain (joints incomplets)
🔴 Soulèvement de composant (tombstone)

=== SYSTÈME DE SÉVÉRITÉ (1-10) ===
Attribue un score de sévérité à chaque problème:
- 1-3: Mineur (esthétique, fonctionnement non affecté)
- 4-6: Modéré (peut affecter la fiabilité à long terme)
- 7-8: Sérieux (risque de dysfonctionnement)
- 9-10: Critique (panne imminente ou danger)

=== FORMAT DE RÉPONSE JSON ===
{
  "summary": "Résumé exécutif",
  "overallStatus": "ok" | "warning" | "error",
  "overallSeverity": 1-10,
  "detectionMethod": "Analyse multi-pasada avec inspection visuelle IA",
  "components": [
    {
      "name": "Nom du composant",
      "type": "capacitor|resistor|ic|connector|inductor|diode|transistor|crystal|fuse|led|regulator|solder_joint|other",
      "status": "ok" | "warning" | "error",
      "severity": 1-10,
      "details": "Description détaillée",
      "location": "Position sur la carte",
      "boundingBox": {"x": 0.123, "y": 0.456, "width": 0.078, "height": 0.045},
      "confidence": 0.95,
      "solderQuality": "good" | "cold" | "bridge" | "excess" | "insufficient" | "lifted",
      "repairDifficulty": "easy" | "medium" | "hard" | "expert",
      "estimatedRepairTime": "5 min",
      "replacementPart": "Référence du composant si à remplacer"
    }
  ],
  "solderAnalysis": {
    "overallQuality": "good" | "fair" | "poor",
    "coldJoints": 0,
    "bridges": 0,
    "excessSolder": 0,
    "insufficientSolder": 0,
    "liftedComponents": 0
  },
  "recommendations": ["Actions prioritaires"],
  "repairGuide": [
    {
      "step": 1,
      "action": "Description de l'action",
      "component": "Composant concerné",
      "tools": ["Outils nécessaires"],
      "difficulty": "easy" | "medium" | "hard",
      "estimatedTime": "5 min",
      "tips": "Conseils pratiques"
    }
  ],
  "partsToReplace": [
    {
      "component": "Nom",
      "reference": "Référence fabricant",
      "quantity": 1,
      "reason": "Raison du remplacement"
    }
  ],
  "analysisQuality": "high|medium|low"
}

RÉPONDS UNIQUEMENT avec le JSON, sans texte avant ou après.
RÉPONDS EN FRANÇAIS.`,

    en: `You are an INDUSTRIAL COMPUTER VISION EXPERT SYSTEM specialized in object detection on printed circuit boards (PCB).

OPERATION MODE: Multi-pass analysis with high precision AI visual inspection and in-depth diagnostics.

${hasImage ? `=== HIGH PRECISION VISUAL DETECTION PROTOCOL ===

*** CRITICAL RULE: BOUNDING BOX PRECISION ***
Bounding boxes MUST be EXACTLY positioned over components.

COORDINATE SYSTEM:
- The entire image goes from (0.0, 0.0) at top-left to (1.0, 1.0) at bottom-right
- x = horizontal position of the LEFT EDGE of the rectangle
- y = vertical position of the TOP EDGE of the rectangle
- width = rectangle width (proportion of total image)
- height = rectangle height (proportion of total image)

VISUAL REFERENCE GRID 10x10:
- Top-left corner: x ≈ 0.0-0.1, y ≈ 0.0-0.1
- Center: x ≈ 0.4-0.6, y ≈ 0.4-0.6
- Bottom-right corner: x ≈ 0.8-0.95, y ≈ 0.8-0.95

` : ''}

${hasReferenceImage ? `=== REFERENCE COMPARISON MODE ===
A reference image (good PCB) is provided.
Compare EACH component between the two images:
- Identify differences in position, color, shape
- Detect missing or added components
- Note visible degradation compared to reference` : ''}

=== MULTI-PASS ANALYSIS ===

PASS 1 - COMPONENT DETECTION:
Identify ALL electronic components present.

PASS 2 - IN-DEPTH DIAGNOSTICS:
For each component, analyze in detail:
- Physical state (color, deformation, burn marks)
- Solder quality
- Alignment and positioning

PASS 3 - SOLDER ANALYSIS:
Specifically detect:
🔴 Cold solder joints (dull, grainy appearance)
🔴 Solder bridges (short circuits between pads)
🔴 Excess solder (balls, overflow)
🔴 Insufficient solder (incomplete joints)
🔴 Component lifting (tombstone)

=== SEVERITY SYSTEM (1-10) ===
Assign a severity score to each problem:
- 1-3: Minor (cosmetic, function not affected)
- 4-6: Moderate (may affect long-term reliability)
- 7-8: Serious (risk of malfunction)
- 9-10: Critical (imminent failure or danger)

=== JSON RESPONSE FORMAT ===
{
  "summary": "Executive summary",
  "overallStatus": "ok" | "warning" | "error",
  "overallSeverity": 1-10,
  "detectionMethod": "Multi-pass analysis with AI visual inspection",
  "components": [
    {
      "name": "Component name",
      "type": "capacitor|resistor|ic|connector|inductor|diode|transistor|crystal|fuse|led|regulator|solder_joint|other",
      "status": "ok" | "warning" | "error",
      "severity": 1-10,
      "details": "Detailed description",
      "location": "Position on board",
      "boundingBox": {"x": 0.123, "y": 0.456, "width": 0.078, "height": 0.045},
      "confidence": 0.95,
      "solderQuality": "good" | "cold" | "bridge" | "excess" | "insufficient" | "lifted",
      "repairDifficulty": "easy" | "medium" | "hard" | "expert",
      "estimatedRepairTime": "5 min",
      "replacementPart": "Component reference if replacement needed"
    }
  ],
  "solderAnalysis": {
    "overallQuality": "good" | "fair" | "poor",
    "coldJoints": 0,
    "bridges": 0,
    "excessSolder": 0,
    "insufficientSolder": 0,
    "liftedComponents": 0
  },
  "recommendations": ["Priority actions"],
  "repairGuide": [
    {
      "step": 1,
      "action": "Action description",
      "component": "Related component",
      "tools": ["Required tools"],
      "difficulty": "easy" | "medium" | "hard",
      "estimatedTime": "5 min",
      "tips": "Practical tips"
    }
  ],
  "partsToReplace": [
    {
      "component": "Name",
      "reference": "Manufacturer reference",
      "quantity": 1,
      "reason": "Reason for replacement"
    }
  ],
  "analysisQuality": "high|medium|low"
}

RESPOND ONLY with JSON, no text before or after.
RESPOND IN ENGLISH.`,

    es: `Eres un SISTEMA EXPERTO DE VISIÓN POR COMPUTADORA INDUSTRIAL especializado en detección de objetos en placas de circuito impreso (PCB).

MODO DE OPERACIÓN: Análisis multi-pasada con inspección visual IA de alta precisión y diagnóstico profundo.

${hasImage ? `=== PROTOCOLO DE DETECCIÓN VISUAL ALTA PRECISIÓN ===

*** REGLA CRÍTICA: PRECISIÓN DE BOUNDING BOXES ***
Los bounding boxes DEBEN estar EXACTAMENTE posicionados sobre los componentes.

SISTEMA DE COORDENADAS:
- La imagen completa va de (0.0, 0.0) arriba-izquierda a (1.0, 1.0) abajo-derecha
- x = posición horizontal del BORDE IZQUIERDO del rectángulo
- y = posición vertical del BORDE SUPERIOR del rectángulo
- width = ancho del rectángulo (proporción de la imagen total)
- height = altura del rectángulo (proporción de la imagen total)

GRILLA DE REFERENCIA VISUAL 10x10:
- Esquina superior izquierda: x ≈ 0.0-0.1, y ≈ 0.0-0.1
- Centro: x ≈ 0.4-0.6, y ≈ 0.4-0.6
- Esquina inferior derecha: x ≈ 0.8-0.95, y ≈ 0.8-0.95

` : ''}

${hasReferenceImage ? `=== MODO COMPARACIÓN CON REFERENCIA ===
Se proporciona una imagen de referencia (PCB en buen estado).
Compara CADA componente entre las dos imágenes:
- Identifica diferencias de posición, color, forma
- Detecta componentes faltantes o agregados
- Nota degradaciones visibles respecto a la referencia` : ''}

=== ANÁLISIS MULTI-PASADA ===

PASADA 1 - DETECCIÓN DE COMPONENTES:
Identifica TODOS los componentes electrónicos presentes.

PASADA 2 - DIAGNÓSTICO PROFUNDO:
Para cada componente, analiza en detalle:
- Estado físico (color, deformación, marcas de quemadura)
- Calidad de soldaduras
- Alineación y posicionamiento

PASADA 3 - ANÁLISIS DE SOLDADURAS:
Detecta específicamente:
🔴 Soldaduras frías (aspecto opaco, granuloso)
🔴 Puentes de soldadura (cortocircuitos entre pads)
🔴 Exceso de estaño (bolas, desbordamientos)
🔴 Falta de estaño (uniones incompletas)
🔴 Levantamiento de componente (tombstone)

=== SISTEMA DE SEVERIDAD (1-10) ===
Asigna un puntaje de severidad a cada problema:
- 1-3: Menor (estético, funcionamiento no afectado)
- 4-6: Moderado (puede afectar confiabilidad a largo plazo)
- 7-8: Serio (riesgo de mal funcionamiento)
- 9-10: Crítico (falla inminente o peligro)

=== FORMATO DE RESPUESTA JSON ===
{
  "summary": "Resumen ejecutivo",
  "overallStatus": "ok" | "warning" | "error",
  "overallSeverity": 1-10,
  "detectionMethod": "Análisis multi-pasada con inspección visual IA",
  "components": [
    {
      "name": "Nombre del componente",
      "type": "capacitor|resistor|ic|connector|inductor|diode|transistor|crystal|fuse|led|regulator|solder_joint|other",
      "status": "ok" | "warning" | "error",
      "severity": 1-10,
      "details": "Descripción detallada",
      "location": "Posición en la placa",
      "boundingBox": {"x": 0.123, "y": 0.456, "width": 0.078, "height": 0.045},
      "confidence": 0.95,
      "solderQuality": "good" | "cold" | "bridge" | "excess" | "insufficient" | "lifted",
      "repairDifficulty": "easy" | "medium" | "hard" | "expert",
      "estimatedRepairTime": "5 min",
      "replacementPart": "Referencia del componente si necesita reemplazo"
    }
  ],
  "solderAnalysis": {
    "overallQuality": "good" | "fair" | "poor",
    "coldJoints": 0,
    "bridges": 0,
    "excessSolder": 0,
    "insufficientSolder": 0,
    "liftedComponents": 0
  },
  "recommendations": ["Acciones prioritarias"],
  "repairGuide": [
    {
      "step": 1,
      "action": "Descripción de la acción",
      "component": "Componente relacionado",
      "tools": ["Herramientas necesarias"],
      "difficulty": "easy" | "medium" | "hard",
      "estimatedTime": "5 min",
      "tips": "Consejos prácticos"
    }
  ],
  "partsToReplace": [
    {
      "component": "Nombre",
      "reference": "Referencia del fabricante",
      "quantity": 1,
      "reason": "Razón del reemplazo"
    }
  ],
  "analysisQuality": "high|medium|low"
}

RESPONDE ÚNICAMENTE con el JSON, sin texto antes o después.
RESPONDE EN ESPAÑOL.`
  };

  return prompts[lang as keyof typeof prompts] || prompts.fr;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, imageMimeType = "image/jpeg", referenceImage, referenceMimeType = "image/jpeg", measurements, language = "fr", detections: rawDetections } = await req.json();
    const t = translations[language as keyof typeof translations] || translations.fr;

    if (!image && (!measurements || measurements.length === 0)) {
      return new Response(
        JSON.stringify({ error: t.noInput }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let detections: NormalizedDetection[] = [];
    let imageUrl: string | undefined;
    let referenceUrl: string | undefined;
    try {
      if (image !== undefined) imageUrl = imageDataUrl(image, imageMimeType);
      if (referenceImage !== undefined) referenceUrl = imageDataUrl(referenceImage, referenceMimeType);
      if (measurements !== undefined && (!Array.isArray(measurements) || measurements.some((m: MeasurementData) => !m || !Number.isFinite(m.value) || !Number.isFinite(m.channel) || !["voltage", "continuity", "resistance", "signal"].includes(m.type) || typeof m.unit !== "string" || !["ok", "warning", "error"].includes(m.status)))) throw new Error("Invalid measurements.");
      detections = normalizeDetections(rawDetections);
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : t.parseError }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const hasImage = !!image;
    const hasReferenceImage = !!referenceImage;
    const hasMeasurements = measurements && measurements.length > 0;
    const measurementReport = hasMeasurements ? formatMeasurementsForAI(measurements, language) : "";

    const systemPrompt = getSystemPrompt(language, hasImage, hasMeasurements, hasReferenceImage) + `

EVIDENCE AND SAFETY RULES (override any conflicting instructions above):
This is a single vision-language inspection${detections.length ? " assisted by the trained YOLO component detections listed below" : ", NOT YOLO, not multiple independent detector passes"}. Do not claim exhaustive coverage or 100% correctness.
First verify the image actually contains a PCB. For an unrelated or unreadable image return warning, no components, low analysisQuality, and request a sharp board photo. Never invent components.
Inspect the whole board systematically, but only list visible identifiable components. Report obscured areas, blur, glare and unreadable markings in summary and recommendations. No visible damage does not establish electrical functionality.
SMALL COMPONENT IDENTIFICATION PRIORITY:
Do not stop at connectors, large capacitors or the main processor. Carefully inspect visible small surface-mount parts around ICs, power circuits and connectors: resistors, ceramic capacitors (MLCC), diodes (including LEDs), transistors and small integrated circuits.
Give each individually distinguishable component its own components entry and tight boundingBox, including parts with no visible damage. Do not enclose a whole cluster in one box when individual parts can be separated. Retain small normalized dimensions; do not enlarge boxes to make components easier to click.
Use type resistor, capacitor, diode, led, transistor or ic only when supported by visible evidence. Explain the evidence (readable R/C/D/Q/U designator, markings, terminals or polarity stripe) in details. Similar unmarked SMD packages cannot reliably distinguish a resistor from a capacitor: name these as unidentified SMD components, type other, and state the ambiguity rather than guessing.
In name include the component family and the PCB designator only if readable. If no designator is readable, use a localized descriptive name, not an invented R1/C1/D1 reference. Never infer resistance, capacitance, diode rating, exact package size or IC model from appearance alone. Only report readable values, and explicitly state when the value or reference is unreadable.
If tiny components lack enough image detail, mention the affected area in summary and request a sharply focused, straight-on macro photo of that area in recommendations. Do not claim that omitted tiny components were checked.
Component dimensions depend on the uploaded photograph, not on typical package sizes. Use boundingBox only when localized in the PRIMARY image, in normalized top-left x,y,width,height coordinates. Omit it when uncertain. Never use reference-image coordinates.
Do not output confidence: no calibrated detector probabilities are available. Never infer internal shorts, dead rails or faulty ICs solely from a photo or from anonymous voltages without expected values and mapped test points.
Distinguish direct observations from hypotheses in component details. State the confirming measurement, expected value only if known, and powering conditions. Do not invent unreadable part references or recommend replacement based only on speculation.
Voltage measurements require a safely powered low-voltage board with protected inputs; resistance and continuity require power removed and capacitors discharged. Never suggest direct Arduino connection to unknown rails or mains.
When there is no image, do not claim to inspect solder or assign bounding boxes; discuss only supplied measurements and missing test-point context.
Reply in the selected language with the JSON format above. Empty arrays are valid when there is insufficient evidence.${detections.length ? `

YOLO DETECTIONS (trained model, authoritative localization):
The user's browser ran a YOLO model trained on labeled PCB component photos; it detected these candidates with normalized boxes (x, y, width, height):
${detections.map((d, i) => `${i + 1}. ${d.label} (${Math.round(d.confidence * 100)}%) box(${d.bbox.x.toFixed(3)}, ${d.bbox.y.toFixed(3)}, ${d.bbox.width.toFixed(3)}, ${d.bbox.height.toFixed(3)})`).join("\n")}
Rules for these detections:
- Use them as the primary component list and copy each detection's boundingBox values EXACTLY into the matching component entry. Do not alter the coordinates.
- Assess each detected component's condition (ok/warning/error) from the image itself; a detection does not imply damage.
- You may discard a clearly wrong detection and mention it in the summary. You may add visible components the model missed, omitting their boundingBox when unsure of the location.
- Never invent extra bounding boxes for YOLO-detected components.` : ""}`;

    const userContent: Array<{type: string; text?: string; image_url?: {url: string}}> = [];

    if (hasImage) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: imageUrl,
        },
      });
    }

    if (hasReferenceImage) {
      userContent.push({
        type: "text",
        text: "IMAGEN DE REFERENCIA (PCB en buen estado):",
      });
      userContent.push({
        type: "image_url",
        image_url: {
          url: referenceUrl,
        },
      });
    }

    const userInstructions: Record<string, string> = {
      fr: `INSTRUCTION D'ANALYSE MULTI-PASADA:

1. PASADA 1 - Scanne l'image systématiquement avec la méthode grille 10x10.
   Détecte TOUS les composants avec bounding boxes précis (3 décimales).

2. PASADA 2 - Pour chaque composant détecté:
   - Évalue son état physique en détail
   - Attribue un score de sévérité de 1 à 10
   - Détermine la difficulté de réparation

3. PASADA 3 - Analyse spécifique des soudures:
   - Identifie tous les défauts de soudure
   - Compte les différents types de problèmes

4. Génère le guide de réparation étape par étape.

5. Liste les composants à remplacer avec leurs références.

${hasMeasurements ? `\nDONNÉES MATÉRIELLES À ANALYSER:${measurementReport}` : ''}

Réponds UNIQUEMENT avec le JSON structuré.`,

      en: `MULTI-PASS ANALYSIS INSTRUCTION:

1. PASS 1 - Systematically scan the image using 10x10 grid method.
   Detect ALL components with precise bounding boxes (3 decimals).

2. PASS 2 - For each detected component:
   - Evaluate its physical state in detail
   - Assign a severity score from 1 to 10
   - Determine repair difficulty

3. PASS 3 - Specific solder analysis:
   - Identify all solder defects
   - Count different types of problems

4. Generate step-by-step repair guide.

5. List components to replace with their references.

${hasMeasurements ? `\nHARDWARE DATA TO ANALYZE:${measurementReport}` : ''}

Respond ONLY with structured JSON.`,

      es: `INSTRUCCIÓN DE ANÁLISIS MULTI-PASADA:

1. PASADA 1 - Escanea la imagen sistemáticamente usando el método de grilla 10x10.
   Detecta TODOS los componentes con bounding boxes precisos (3 decimales).

2. PASADA 2 - Para cada componente detectado:
   - Evalúa su estado físico en detalle
   - Asigna un puntaje de severidad de 1 a 10
   - Determina la dificultad de reparación

3. PASADA 3 - Análisis específico de soldaduras:
   - Identifica todos los defectos de soldadura
   - Cuenta los diferentes tipos de problemas

4. Genera la guía de reparación paso a paso.

5. Lista los componentes a reemplazar con sus referencias.

${hasMeasurements ? `\nDATOS DE HARDWARE A ANALIZAR:${measurementReport}` : ''}

Responde ÚNICAMENTE con el JSON estructurado.`
    };

    userContent.push({
      type: "text",
      text: userInstructions[language] || userInstructions.fr,
    });

    console.log(`Sending request to AI gateway [${language}] with multi-pass analysis...`);

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
        temperature: 0.05,
      }),
    });

    if (!response.ok) {
      const upstream = await response.json().catch(() => ({}));
      const reason = upstream.message || (typeof upstream.error === "string" ? upstream.error : upstream.error?.message);
      return new Response(JSON.stringify({ error: reason || `${t.aiServiceError}: ${response.status}` }), {
        status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json", ...(response.headers.get("Retry-After") ? { "Retry-After": response.headers.get("Retry-After") as string } : {}) }
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error(t.noAIResponse);
    }

    // Parse the JSON response
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
      const detectionMethodLabel = detections.length
        ? (language === "en" ? "Trained YOLO model (10 component classes) + AI visual inspection — provisional diagnosis"
          : language === "es" ? "Modelo YOLO entrenado (10 clases de componentes) + inspección visual IA — diagnóstico provisional"
          : "Modèle YOLO entraîné (10 classes de composants) + inspection visuelle IA — diagnostic provisoire")
        : undefined;
      diagnosticData = normalizeDiagnostic(JSON.parse(jsonString.trim()), hasImage, language, detectionMethodLabel);
      diagnosticData.detectionSource = detections.length ? "yolo" : "ai";
    } catch {
      return new Response(JSON.stringify({ error: t.parseError }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

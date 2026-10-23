export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function imageDataUrl(image: unknown, mime: unknown = "image/jpeg"): string {
  if (typeof image !== "string" || !IMAGE_TYPES.includes(String(mime))) throw new Error("Unsupported image format: JPEG, PNG or WebP required.");
  if (!image.length || image.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(image)) throw new Error("Invalid image or image exceeds 10 MB.");
  let bytes: string;
  try { bytes = atob(image); } catch { throw new Error("Invalid image encoding."); }
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error("Image exceeds 10 MB.");
  const matches = mime === "image/jpeg" ? bytes.startsWith("\xff\xd8\xff")
    : mime === "image/png" ? bytes.startsWith("\x89PNG\r\n\x1a\n")
    : bytes.startsWith("RIFF") && bytes.slice(8, 12) === "WEBP";
  if (!matches) throw new Error("Image content does not match its format.");
  return `data:${mime};base64,${image}`;
}

export function normalizeBox(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const b = value as Record<string, unknown>;
  const { x, y, width, height } = b;
  if (![x, y, width, height].every(v => typeof v === "number" && Number.isFinite(v))) return undefined;
  if (typeof x !== "number" || typeof y !== "number" || typeof width !== "number" || typeof height !== "number") return undefined;
  if (x < 0 || y < 0 || x >= 1 || y >= 1 || width <= 0 || height <= 0 || width > 1 || height > 1) return undefined;
  return { x, y, width: Math.min(width, 1 - x), height: Math.min(height, 1 - y) };
}

export const MAX_DETECTIONS = 100;

export interface NormalizedDetection {
  label: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
}

export function normalizeDetections(value: unknown): NormalizedDetection[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error("Invalid detections.");
  if (value.length > MAX_DETECTIONS) throw new Error("Too many detections.");
  return value.map(d => {
    if (!d || typeof d !== "object") throw new Error("Invalid detections.");
    const { label, confidence, bbox } = d as Record<string, unknown>;
    if (typeof label !== "string" || !label.trim() || label.length > 40) throw new Error("Invalid detections.");
    if (typeof confidence !== "number" || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) throw new Error("Invalid detections.");
    const box = normalizeBox(bbox);
    if (!box) throw new Error("Invalid detections.");
    return { label: label.trim(), confidence, bbox: box };
  });
}

export function normalizeDiagnostic(value: unknown, hasImage: boolean, language: string, detectionMethodLabel?: string) {
  if (!value || typeof value !== "object") throw new Error("Invalid diagnostic response.");
  const d = value as Record<string, any>;
  const statuses = ["ok", "warning", "error"];
  if (typeof d.summary !== "string" || !statuses.includes(d.overallStatus) || !Array.isArray(d.components) || !Array.isArray(d.recommendations) || !d.recommendations.every((v: unknown) => typeof v === "string")) throw new Error("Invalid diagnostic response.");
  d.components = d.components.map((c: Record<string, any>) => {
    if (!c || typeof c.name !== "string" || typeof c.details !== "string" || !statuses.includes(c.status)) throw new Error("Invalid component response.");
    const boundingBox = hasImage ? normalizeBox(c.boundingBox) : undefined;
    // A generated confidence number is not a calibrated detector probability.
    const { confidence, ...rest } = c;
    return { ...rest, boundingBox };
  });
  d.detectionMethod = detectionMethodLabel ?? (language === "en" ? "AI visual inspection — provisional diagnosis" : "Inspection visuelle IA — diagnostic provisoire");
  if (hasImage) d.summary += language === "en"
    ? " This is a provisional visual assessment, not confirmation of electrical operation; confirm suspected faults with appropriate measurements."
    : " Il s'agit d'une évaluation visuelle provisoire, pas d'une confirmation du fonctionnement électrique ; confirmez les défauts suspectés par des mesures adaptées.";
  return d;
}
const DETECTION_NAMES: Record<string, { fr: string; en: string; es: string; type: string }> = {
  "Resistor": { fr: "Résistance CMS", en: "SMD resistor", es: "Resistencia SMD", type: "resistor" },
  "Capacitor": { fr: "Condensateur", en: "Capacitor", es: "Condensador", type: "capacitor" },
  "Diode": { fr: "Diode", en: "Diode", es: "Diodo", type: "diode" },
  "LED": { fr: "LED", en: "LED", es: "LED", type: "led" },
  "IC": { fr: "Circuit intégré", en: "Integrated circuit", es: "Circuito integrado", type: "ic" },
  "Connector": { fr: "Connecteur", en: "Connector", es: "Conector", type: "connector" },
  "Switch/Button": { fr: "Interrupteur / bouton", en: "Switch / button", es: "Interruptor / botón", type: "other" },
  "Header": { fr: "Barrette de broches", en: "Pin header", es: "Tira de pines", type: "connector" },
  "Crystal": { fr: "Quartz", en: "Crystal", es: "Cristal", type: "crystal" },
  "Debug/TP": { fr: "Point de test", en: "Test point", es: "Punto de prueba", type: "other" },
};

function boxIoU(a: NormalizedDetection["bbox"], b: NormalizedDetection["bbox"]): number {
  const w = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const h = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  const inter = w * h;
  const union = a.width * a.height + b.width * b.height - inter;
  return union > 0 ? inter / union : 0;
}

/**
 * Every trained-model detection must reach the user: detections the AI left out
 * of its component list are appended with their exact box and a neutral note.
 */
export function addMissingDetections(components: Record<string, any>[], detections: NormalizedDetection[], language: string) {
  const lang = language === "en" ? "en" : language === "es" ? "es" : "fr";
  const note = {
    fr: "Détecté par le modèle entraîné. Aucune anomalie visible n'a été signalée pour ce composant ; vérifiez-le par mesure si nécessaire.",
    en: "Detected by the trained model. No visible anomaly was reported for this component; verify it by measurement if needed.",
    es: "Detectado por el modelo entrenado. No se informó ninguna anomalía visible para este componente; verifíquelo con mediciones si es necesario.",
  }[lang];
  const result = [...components];
  for (const d of detections) {
    const covered = result.some(c => c.boundingBox && boxIoU(c.boundingBox, d.bbox) >= 0.5);
    if (covered) continue;
    const info = DETECTION_NAMES[d.label];
    result.push({
      name: info ? info[lang] : d.label,
      type: info?.type ?? "other",
      status: "ok",
      details: note,
      boundingBox: { ...d.bbox },
    });
  }
  return result;
}

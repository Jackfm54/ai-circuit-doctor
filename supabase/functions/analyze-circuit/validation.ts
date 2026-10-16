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

export function normalizeDiagnostic(value: unknown, hasImage: boolean, language: string) {
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
  d.detectionMethod = language === "en" ? "AI visual inspection — provisional diagnosis" : "Inspection visuelle IA — diagnostic provisoire";
  return d;
}
import * as ort from "onnxruntime-web";
import modelAsset from "@/assets/pcb_yolov8s.onnx.asset.json";
import wasmAsset from "@/assets/ort-wasm-simd-threaded.wasm.asset.json";
import wasmLoaderAsset from "@/assets/ort-wasm-simd-threaded.mjs.asset.json";

// Classes of the trained PCB component model
// (github.com/wangshnegqi/pcb-component-detection-dataset-yolo, CC BY 4.0)
export const YOLO_CLASSES = [
  "Resistor",
  "Capacitor",
  "Diode",
  "LED",
  "IC",
  "Connector",
  "Switch/Button",
  "Header",
  "Crystal",
  "Debug/TP",
] as const;

export interface YoloDetection {
  label: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
}

const IMG_SIZE = 960;
const CONF_THRESHOLD = 0.3;
// Tiles see micro components (SMD resistors, MLCC, diodes) at higher zoom, so a
// slightly lower threshold is still reliable there.
const TILE_CONF_THRESHOLD = 0.2;
const IOU_THRESHOLD = 0.45;
// Same-class box mostly inside a stronger one = duplicate from another tile.
const CONTAINMENT_THRESHOLD = 0.75;
const MAX_DETECTIONS = 100;
const TILE_OVERLAP = 0.2;
const MIN_SIDE_FOR_TILING = 700;

let sessionPromise: Promise<ort.InferenceSession> | null = null;

function getSession(): Promise<ort.InferenceSession> {
  if (!sessionPromise) {
    (ort.env.wasm as unknown as { wasmPaths: unknown }).wasmPaths = {
      mjs: new URL(wasmLoaderAsset.url, window.location.origin).href,
      wasm: new URL(wasmAsset.url, window.location.origin).href,
    };
    ort.env.wasm.numThreads = 1;
    sessionPromise = ort.InferenceSession.create(modelAsset.url, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    }).catch((error) => {
      sessionPromise = null;
      throw error;
    });
  }
  return sessionPromise;
}

interface Box { x: number; y: number; width: number; height: number }
interface Candidate extends Box { score: number; cls: number }

function intersection(a: Box, b: Box): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  return Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
}

function iou(a: Box, b: Box): number {
  const inter = intersection(a, b);
  const union = a.width * a.height + b.width * b.height - inter;
  return union > 0 ? inter / union : 0;
}

/** Share of the smaller box covered by the other one. */
function containment(a: Box, b: Box): number {
  const smaller = Math.min(a.width * a.height, b.width * b.height);
  return smaller > 0 ? intersection(a, b) / smaller : 0;
}

/**
 * Runs the model on one region of the image (the whole image or a zoomed tile)
 * and returns candidates normalized to the ORIGINAL image (0-1).
 */
async function detectRegion(
  session: ort.InferenceSession,
  bitmap: ImageBitmap,
  region: { sx: number; sy: number; sw: number; sh: number },
  threshold: number,
  isTile: boolean,
): Promise<Candidate[]> {
  const { sx, sy, sw, sh } = region;
  const scale = Math.min(IMG_SIZE / sw, IMG_SIZE / sh);
  const resizedW = Math.round(sw * scale);
  const resizedH = Math.round(sh * scale);
  const padX = (IMG_SIZE - resizedW) / 2;
  const padY = (IMG_SIZE - resizedH) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = IMG_SIZE;
  canvas.height = IMG_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D context unavailable.");
  ctx.fillStyle = "rgb(114,114,114)";
  ctx.fillRect(0, 0, IMG_SIZE, IMG_SIZE);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, sw, sh, padX, padY, resizedW, resizedH);

  const pixels = ctx.getImageData(0, 0, IMG_SIZE, IMG_SIZE).data;
  const plane = IMG_SIZE * IMG_SIZE;
  const input = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    input[i] = pixels[i * 4] / 255;
    input[plane + i] = pixels[i * 4 + 1] / 255;
    input[2 * plane + i] = pixels[i * 4 + 2] / 255;
  }

  const feeds = { [session.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, IMG_SIZE, IMG_SIZE]) };
  const results = await session.run(feeds);
  const output = results[session.outputNames[0]];
  const out = output.data as Float32Array;
  const numAnchors = output.dims[2];
  const numClasses = output.dims[1] - 4;

  // Tile borders that are inside the image: boxes touching them are cut-off
  // fragments; the overlapping neighbour tile sees the full component.
  const edgeMargin = 4 / scale;
  const innerLeft = isTile && sx > 0;
  const innerTop = isTile && sy > 0;
  const innerRight = isTile && sx + sw < bitmap.width;
  const innerBottom = isTile && sy + sh < bitmap.height;

  const candidates: Candidate[] = [];
  for (let i = 0; i < numAnchors; i++) {
    let bestCls = 0;
    let bestScore = 0;
    for (let c = 0; c < numClasses; c++) {
      const score = out[(4 + c) * numAnchors + i];
      if (score > bestScore) {
        bestScore = score;
        bestCls = c;
      }
    }
    if (bestScore < threshold) continue;

    const cx = out[i];
    const cy = out[numAnchors + i];
    const w = out[2 * numAnchors + i];
    const h = out[3 * numAnchors + i];

    // Letterbox space -> region pixels
    const left = (cx - w / 2 - padX) / scale;
    const top = (cy - h / 2 - padY) / scale;
    const right = left + w / scale;
    const bottom = top + h / scale;

    if (innerLeft && left <= edgeMargin) continue;
    if (innerTop && top <= edgeMargin) continue;
    if (innerRight && right >= sw - edgeMargin) continue;
    if (innerBottom && bottom >= sh - edgeMargin) continue;

    // Region pixels -> original image normalized 0-1
    const x1 = Math.max(0, (sx + left) / bitmap.width);
    const y1 = Math.max(0, (sy + top) / bitmap.height);
    const x2 = Math.min(1, (sx + right) / bitmap.width);
    const y2 = Math.min(1, (sy + bottom) / bitmap.height);
    if (x2 - x1 <= 0.001 || y2 - y1 <= 0.001) continue;

    candidates.push({ x: x1, y: y1, width: x2 - x1, height: y2 - y1, score: bestScore, cls: bestCls });
  }
  return candidates;
}

interface Region { sx: number; sy: number; sw: number; sh: number }

/**
 * Area of the photo that contains the board: the union of the first-pass
 * detections plus a margin, so zoomed tiles are spent on the board and not on
 * the table around it.
 */
function boardArea(candidates: Candidate[], width: number, height: number): Region {
  if (candidates.length === 0) return { sx: 0, sy: 0, sw: width, sh: height };
  let x1 = 1, y1 = 1, x2 = 0, y2 = 0;
  for (const c of candidates) {
    x1 = Math.min(x1, c.x);
    y1 = Math.min(y1, c.y);
    x2 = Math.max(x2, c.x + c.width);
    y2 = Math.max(y2, c.y + c.height);
  }
  const marginX = (x2 - x1) * 0.12;
  const marginY = (y2 - y1) * 0.12;
  const sx = Math.round(Math.max(0, x1 - marginX) * width);
  const sy = Math.round(Math.max(0, y1 - marginY) * height);
  const ex = Math.round(Math.min(1, x2 + marginX) * width);
  const ey = Math.round(Math.min(1, y2 + marginY) * height);
  return { sx, sy, sw: ex - sx, sh: ey - sy };
}

function tileRegions(area: Region): Region[] {
  const { sx: ox, sy: oy, sw: width, sh: height } = area;
  if (Math.min(width, height) < MIN_SIDE_FOR_TILING) return [];
  // Larger areas get a finer grid so micro components stay visible to the model.
  const grid = Math.max(width, height) >= 1400 ? 4 : 2;
  const cols = width >= height ? grid : Math.max(2, grid - 1);
  const rows = height > width ? grid : Math.max(2, grid - 1);
  const tileW = width / (cols - (cols - 1) * TILE_OVERLAP);
  const tileH = height / (rows - (rows - 1) * TILE_OVERLAP);
  const regions: Region[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const sx = Math.round(c * tileW * (1 - TILE_OVERLAP));
      const sy = Math.round(r * tileH * (1 - TILE_OVERLAP));
      regions.push({
        sx: ox + sx,
        sy: oy + sy,
        sw: Math.min(Math.round(tileW), width - sx),
        sh: Math.min(Math.round(tileH), height - sy),
      });
    }
  }
  return regions;
}

/**
 * Runs the trained YOLO model in the browser and returns component detections
 * with boxes normalized to the ORIGINAL image (0-1, top-left origin).
 * The whole photo is analysed first (large parts), then overlapping zoomed
 * tiles over the board area (micro SMD parts); results are merged without duplicates.
 */
export async function detectComponents(imageUrl: string): Promise<YoloDetection[]> {
  const session = await getSession();

  const blob = await (await fetch(imageUrl)).blob();
  const bitmap = await createImageBitmap(blob);

  try {
    const candidates = await detectRegion(
      session,
      bitmap,
      { sx: 0, sy: 0, sw: bitmap.width, sh: bitmap.height },
      CONF_THRESHOLD,
      false,
    );
    const area = boardArea(candidates, bitmap.width, bitmap.height);
    for (const region of tileRegions(area)) {
      candidates.push(...(await detectRegion(session, bitmap, region, TILE_CONF_THRESHOLD, true)));
    }

    candidates.sort((a, b) => b.score - a.score);
    const kept: Candidate[] = [];
    for (const candidate of candidates) {
      const duplicate = kept.some(k =>
        iou(k, candidate) >= IOU_THRESHOLD ||
        (k.cls === candidate.cls && containment(k, candidate) >= CONTAINMENT_THRESHOLD),
      );
      if (!duplicate) kept.push(candidate);
      if (kept.length >= MAX_DETECTIONS) break;
    }

    return kept.map(k => ({
      label: YOLO_CLASSES[k.cls],
      confidence: k.score,
      bbox: { x: k.x, y: k.y, width: k.width, height: k.height },
    }));
  } finally {
    bitmap.close();
  }
}

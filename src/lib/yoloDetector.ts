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
const IOU_THRESHOLD = 0.45;
const MAX_DETECTIONS = 60;

let sessionPromise: Promise<ort.InferenceSession> | null = null;

function getSession(): Promise<ort.InferenceSession> {
  if (!sessionPromise) {
    (ort.env.wasm as unknown as { wasmPaths: unknown }).wasmPaths = {
      mjs: new URL(wasmLoaderUrl, window.location.origin).href,
      wasm: new URL(wasmUrl, window.location.origin).href,
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

function iou(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = a.width * a.height + b.width * b.height - inter;
  return union > 0 ? inter / union : 0;
}

/**
 * Runs the trained YOLO model in the browser and returns component detections
 * with boxes normalized to the ORIGINAL image (0-1, top-left origin).
 */
export async function detectComponents(imageUrl: string): Promise<YoloDetection[]> {
  const session = await getSession();

  const blob = await (await fetch(imageUrl)).blob();
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(IMG_SIZE / bitmap.width, IMG_SIZE / bitmap.height);
  const resizedW = Math.round(bitmap.width * scale);
  const resizedH = Math.round(bitmap.height * scale);
  const padX = (IMG_SIZE - resizedW) / 2;
  const padY = (IMG_SIZE - resizedH) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = IMG_SIZE;
  canvas.height = IMG_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D context unavailable.");
  ctx.drawImage(bitmap, padX, padY, resizedW, resizedH);

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

  interface Candidate { x: number; y: number; width: number; height: number; score: number; cls: number }
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
    if (bestScore < CONF_THRESHOLD) continue;

    const cx = out[i];
    const cy = out[numAnchors + i];
    const w = out[2 * numAnchors + i];
    const h = out[3 * numAnchors + i];

    // Letterbox space -> original image pixels -> normalized 0-1
    const left = (cx - w / 2 - padX) / scale;
    const top = (cy - h / 2 - padY) / scale;
    const boxW = w / scale;
    const boxH = h / scale;
    const nx = left / bitmap.width;
    const ny = top / bitmap.height;
    const nw = boxW / bitmap.width;
    const nh = boxH / bitmap.height;

    const x1 = Math.max(0, nx);
    const y1 = Math.max(0, ny);
    const x2 = Math.min(1, nx + nw);
    const y2 = Math.min(1, ny + nh);
    if (x2 - x1 <= 0.001 || y2 - y1 <= 0.001) continue;

    candidates.push({ x: x1, y: y1, width: x2 - x1, height: y2 - y1, score: bestScore, cls: bestCls });
  }

  candidates.sort((a, b) => b.score - a.score);
  const kept: Candidate[] = [];
  for (const candidate of candidates) {
    if (kept.every(k => iou(k, candidate) < IOU_THRESHOLD)) kept.push(candidate);
    if (kept.length >= MAX_DETECTIONS) break;
  }

  bitmap.close();
  return kept.map(k => ({
    label: YOLO_CLASSES[k.cls],
    confidence: k.score,
    bbox: { x: k.x, y: k.y, width: k.width, height: k.height },
  }));
}

import { decodeYolo26 } from "./yolo26-output";
import wasmUrl from "onnxruntime-web/ort-wasm-simd-threaded.wasm?url";
import wasmModuleUrl from "onnxruntime-web/ort-wasm-simd-threaded.mjs?url";

export async function createYolo26Session(file: File) {
  const ort = await import("onnxruntime-web/wasm");
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.wasmPaths = { wasm: wasmUrl, mjs: wasmModuleUrl };
  const session = await ort.InferenceSession.create(await file.arrayBuffer(), { executionProviders: ["wasm"] });
  const input = session.inputMetadata[0];
  if (!input.isTensor || input.shape.join(",") !== "1,3,640,640") {
    await session.release();
    throw new Error("Export ONNX: imgsz=640, dynamic=False, nms=False.");
  }
  return session;
}

export async function detectYolo26(session: Awaited<ReturnType<typeof createYolo26Session>>, preview: string, labels: string[], threshold: number) {
  const ort = await import("onnxruntime-web/wasm");
  const image = new Image();
  image.src = preview;
  await image.decode();
  const gain = Math.min(640 / image.naturalWidth, 640 / image.naturalHeight);
  const width = Math.round(image.naturalWidth * gain);
  const height = Math.round(image.naturalHeight * gain);
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 640;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  context.fillStyle = "rgb(114, 114, 114)"; // Required YOLO letterbox preprocessing, not a UI color.
  context.fillRect(0, 0, 640, 640);
  context.drawImage(image, Math.round((640 - width) / 2 - 0.1), Math.round((640 - height) / 2 - 0.1), width, height);
  const pixels = context.getImageData(0, 0, 640, 640).data;
  const input = new Float32Array(3 * 640 * 640);
  for (let i = 0; i < 640 * 640; i++) {
    for (let c = 0; c < 3; c++) input[c * 640 * 640 + i] = pixels[i * 4 + c] / 255;
  }
  const outputs = await session.run({ [session.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, 640, 640]) });
  const output = outputs[session.outputNames[0]];
  try {
    if (!output || output.type !== "float32") throw new Error("Unsupported model output");
    return decodeYolo26(output.data as Float32Array, output.dims, labels, image.naturalWidth, image.naturalHeight, threshold);
  } finally {
    Object.values(outputs).forEach(tensor => tensor.dispose());
  }
}
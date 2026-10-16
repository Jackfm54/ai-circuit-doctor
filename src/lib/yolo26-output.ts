export interface YoloDetection {
  label: string;
  score: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Fixed-size, one-to-one YOLO26 ONNX output: [1, max_det, 6], xyxy/conf/class.
export function decodeYolo26(data: ArrayLike<number>, dims: readonly number[], labels: string[], imageWidth: number, imageHeight: number, threshold: number): YoloDetection[] {
  if (dims.length !== 3 || dims[0] !== 1 || dims[2] !== 6) throw new Error("Expected YOLO26 one-to-one output [1, N, 6]. Export with nms=False.");
  const gain = Math.min(640 / imageWidth, 640 / imageHeight);
  const resizedWidth = Math.round(imageWidth * gain);
  const resizedHeight = Math.round(imageHeight * gain);
  const padX = Math.round((640 - resizedWidth) / 2 - 0.1);
  const padY = Math.round((640 - resizedHeight) / 2 - 0.1);
  const detections: YoloDetection[] = [];
  for (let row = 0; row < dims[1]; row++) {
    const offset = row * 6;
    const [left, top, right, bottom, score, classId] = Array.from({ length: 6 }, (_, col) => Number(data[offset + col]));
    if (![left, top, right, bottom, score, classId].every(Number.isFinite) || score < threshold || score > 1) continue;
    if (!Number.isInteger(classId) || !labels[classId]) throw new Error("Model class does not match labels.json.");
    const x = Math.max(0, Math.min(1, (left - padX) / resizedWidth));
    const y = Math.max(0, Math.min(1, (top - padY) / resizedHeight));
    const x2 = Math.max(0, Math.min(1, (right - padX) / resizedWidth));
    const y2 = Math.max(0, Math.min(1, (bottom - padY) / resizedHeight));
    if (x2 <= x || y2 <= y) continue;
    detections.push({ label: labels[classId], score, x, y, width: x2 - x, height: y2 - y });
  }
  return detections;
}
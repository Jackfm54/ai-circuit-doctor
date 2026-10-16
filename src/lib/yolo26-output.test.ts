/// <reference types="bun" />
import { describe, expect, it } from "bun:test";
import { decodeYolo26 } from "./yolo26-output";

describe("YOLO26 one-to-one output", () => {
  it("maps a letterboxed landscape photo back to its original coordinates", () => {
    const [box] = decodeYolo26([160, 240, 480, 400, 0.9, 0], [1, 1, 6], ["capacitor"], 1280, 640, 0.25);
    expect(box).toEqual({ label: "capacitor", score: 0.9, x: 0.25, y: 0.25, width: 0.5, height: 0.5 });
  });
  it("filters low scores and padding-only boxes", () => {
    expect(decodeYolo26([0, 0, 20, 20, 0.9, 0, 160, 240, 480, 400, 0.1, 0], [1, 2, 6], ["capacitor"], 1280, 640, 0.25)).toEqual([]);
  });
  it("rejects one-to-many exports rather than inventing detections", () => {
    expect(() => decodeYolo26([], [1, 84, 8400], [], 640, 640, 0.25)).toThrow();
  });
  it("rejects mismatched class labels", () => {
    expect(() => decodeYolo26([10, 10, 30, 30, 0.9, 2], [1, 1, 6], ["capacitor"], 640, 640, 0.25)).toThrow();
  });
});
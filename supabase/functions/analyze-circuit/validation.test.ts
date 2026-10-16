import { describe, expect, test } from "bun:test";
import { imageDataUrl, normalizeBox, normalizeDiagnostic } from "./validation";

describe("Real image diagnostic validation", () => {
  test("preserves PNG encoding instead of labelling it JPEG", () => {
    expect(imageDataUrl(btoa("\x89PNG\r\n\x1a\ncontents"), "image/png")).toStartWith("data:image/png;base64,");
    expect(() => imageDataUrl(btoa("\x89PNG\r\n\x1a\ncontents"), "image/jpeg")).toThrow();
  });
  test("rejects empty and unsupported images", () => {
    expect(() => imageDataUrl("", "image/png")).toThrow();
    expect(() => imageDataUrl("AAAA", "image/heic")).toThrow();
  });
  test("does not shrink large components or move small coordinates", () => {
    expect(normalizeBox({ x: .0012, y: .2, width: .7, height: .005 })).toEqual({ x: .0012, y: .2, width: .7, height: .005 });
  });
  test("rejects fabricated invalid boxes", () => {
    expect(normalizeBox({ x: "bad", y: .2, width: .1, height: .1 })).toBeUndefined();
  });
  test("clips only at the actual image boundary", () => {
    expect(normalizeBox({ x: .9, y: .9, width: .2, height: .2 })?.width).toBeCloseTo(.1);
  });
  test("does not manufacture confidence or coordinates for hardware", () => {
    const d = normalizeDiagnostic({ summary: "Test", overallStatus: "warning", recommendations: [], components: [{ name: "A0", details: "Measure", status: "warning", confidence: .1, boundingBox: { x: .1, y: .1, width: .1, height: .1 } }] }, false, "fr");
    expect(d.components[0].confidence).toBeUndefined();
    expect(d.components[0].boundingBox).toBeUndefined();
  });
  test("invalid AI output fails rather than returning a fabricated report", () => {
    expect(() => normalizeDiagnostic({ summary: "Oops" }, true, "fr")).toThrow();
  });
});
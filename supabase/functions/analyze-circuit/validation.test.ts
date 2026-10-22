import { describe, expect, test } from "bun:test";
import { imageDataUrl, normalizeBox, normalizeDetections, normalizeDiagnostic } from "./validation";

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
  test("preserves individual tiny SMD component boxes without enlarging them", () => {
    const box = { x: 0.32145, y: 0.65432, width: 0.002, height: 0.003 };
    const d = normalizeDiagnostic({ summary: "Visible SMD", overallStatus: "ok", recommendations: [], components: [{ name: "Small SMD resistor", details: "Value unreadable", status: "ok", boundingBox: box }] }, true, "en");
    expect(d.components[0].boundingBox).toEqual(box);
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
  test("keeps trained-model detections with exact boxes and confidence", () => {
    const detections = normalizeDetections([{ label: "IC", confidence: 0.92, bbox: { x: 0.117, y: 0.279, width: 0.08, height: 0.09 } }]);
    expect(detections).toEqual([{ label: "IC", confidence: 0.92, bbox: { x: 0.117, y: 0.279, width: 0.08, height: 0.09 } }]);
  });
  test("rejects detections with invalid confidence, box or payload", () => {
    expect(() => normalizeDetections([{ label: "IC", confidence: 1.5, bbox: { x: 0, y: 0, width: 0.1, height: 0.1 } }])).toThrow();
    expect(() => normalizeDetections([{ label: "IC", confidence: 0.9, bbox: { x: -1, y: 0, width: 0.1, height: 0.1 } }])).toThrow();
    expect(() => normalizeDetections([{ label: "", confidence: 0.9, bbox: { x: 0, y: 0, width: 0.1, height: 0.1 } }])).toThrow();
    expect(() => normalizeDetections("nope")).toThrow();
  });
  test("absent detections stay empty instead of fabricating any", () => {
    expect(normalizeDetections(undefined)).toEqual([]);
    expect(normalizeDetections(null)).toEqual([]);
  });
  test("visual assessment includes its electrical verification limitation", () => {
    const d = normalizeDiagnostic({ summary: "No visible fault", overallStatus: "ok", components: [], recommendations: [] }, true, "en");
    expect(d.summary).toContain("not confirmation of electrical operation");
  });
});
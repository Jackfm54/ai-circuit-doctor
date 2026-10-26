export interface MeasurementData {
  type: "voltage" | "continuity" | "resistance" | "signal";
  channel: number;
  value: number;
  unit: string;
  timestamp: number;
  status: "ok" | "warning" | "error";
}

export function parseMeasurement(line: string): MeasurementData | null {
  const parts = line.trim().split(",").map(part => part.trim());
  if (parts.length !== 5) return null;
  const types: Record<string, MeasurementData["type"]> = {
    VOLTAGE: "voltage", CONTINUITY: "continuity", RESISTANCE: "resistance", SIGNAL: "signal",
  };
  const type = types[parts[0].toUpperCase()];
  const channel = Number(parts[1]);
  const value = Number(parts[2]);
  const status = parts[4].toLowerCase();
  if (!type || !parts[1] || !parts[2] || !Number.isInteger(channel) || channel < 1 ||
      !Number.isFinite(value) || !parts[3] ||
      (status !== "ok" && status !== "warning" && status !== "error")) return null;
  return { type, channel, value, unit: parts[3], timestamp: Date.now(), status };
}
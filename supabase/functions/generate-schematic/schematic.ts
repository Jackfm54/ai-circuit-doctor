export type BlockKind = "power" | "protection" | "processor" | "memory" | "communication" | "interface" | "clock" | "passive" | "other";
const KINDS: BlockKind[] = ["power", "protection", "processor", "memory", "communication", "interface", "clock", "passive", "other"];
const LINK_TYPES = ["power", "data", "ground", "analog", "rf"] as const;

export interface SchematicBlock { id: string; name: string; kind: BlockKind; components: number[]; status: "ok" | "warning" | "fault"; note?: string }
export interface SchematicLink { from: string; to: string; signal: string; type: typeof LINK_TYPES[number] }
export interface Schematic { title: string; blocks: SchematicBlock[]; connections: SchematicLink[]; notes: string[] }

/** Keeps only consistent blocks/links: valid component numbers, no duplicates, links between existing blocks. */
export function normalizeSchematic(value: unknown, componentCount: number): Schematic {
  if (!value || typeof value !== "object") throw new Error("Invalid schematic.");
  const v = value as Record<string, any>;
  if (!Array.isArray(v.blocks) || v.blocks.length === 0) throw new Error("Invalid schematic.");
  const used = new Set<number>();
  const ids = new Set<string>();
  const blocks: SchematicBlock[] = [];
  for (const b of v.blocks.slice(0, 12)) {
    if (!b || typeof b.id !== "string" || typeof b.name !== "string" || ids.has(b.id)) continue;
    const components = (Array.isArray(b.components) ? b.components : [])
      .filter((n: unknown) => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= componentCount && !used.has(n as number));
    components.forEach((n: number) => used.add(n));
    ids.add(b.id);
    blocks.push({
      id: b.id.slice(0, 40),
      name: b.name.slice(0, 60),
      kind: KINDS.includes(b.kind) ? b.kind : "other",
      components,
      status: ["ok", "warning", "fault"].includes(b.status) ? b.status : "ok",
      note: typeof b.note === "string" ? b.note.slice(0, 160) : undefined,
    });
  }
  if (blocks.length === 0) throw new Error("Invalid schematic.");
  const seen = new Set<string>();
  const connections: SchematicLink[] = (Array.isArray(v.connections) ? v.connections : [])
    .filter((c: any) => c && ids.has(c.from) && ids.has(c.to) && c.from !== c.to && typeof c.signal === "string")
    .filter((c: any) => { const k = `${c.from}>${c.to}>${c.signal}`; if (seen.has(k)) return false; seen.add(k); return true; })
    .slice(0, 30)
    .map((c: any) => ({ from: c.from, to: c.to, signal: c.signal.slice(0, 30), type: LINK_TYPES.includes(c.type) ? c.type : "data" }));
  return {
    title: typeof v.title === "string" ? v.title.slice(0, 100) : "Schematic",
    blocks,
    connections,
    notes: (Array.isArray(v.notes) ? v.notes : []).filter((n: unknown) => typeof n === "string").slice(0, 6).map((n: string) => n.slice(0, 240)),
  };
}

const SYMBOLS = ["resistor", "capacitor", "diode", "led", "crystal", "transistor", "ic", "connector", "switch", "other"] as const;
export interface NetlistPart { component: number; designator: string; symbol: typeof SYMBOLS[number]; label: string; pins: { name: string; net: string }[] }
export interface Netlist { title: string; parts: NetlistPart[]; nets: { name: string; kind: "power" | "ground" | "signal" }[]; notes: string[] }

function netName(v: unknown) { return String(v ?? "").trim().toUpperCase().replace(/\s+/g, "_").slice(0, 20); }

/** Component-level netlist: valid component numbers, unique designators, 2 pins for passives, every pin on a declared net. */
export function normalizeNetlist(value: unknown, componentCount: number): Netlist {
  if (!value || typeof value !== "object") throw new Error("Invalid netlist.");
  const v = value as Record<string, any>;
  if (!Array.isArray(v.parts)) throw new Error("Invalid netlist.");
  const used = new Set<number>(), designators = new Set<string>();
  const parts: NetlistPart[] = [];
  for (const p of v.parts) {
    if (parts.length >= 40) break;
    if (!p || !Number.isInteger(p.component) || p.component < 1 || p.component > componentCount || used.has(p.component)) continue;
    const designator = String(p.designator ?? "").trim().toUpperCase().slice(0, 8);
    if (!designator || designators.has(designator)) continue;
    const symbol = SYMBOLS.includes(p.symbol) ? p.symbol : "other";
    const maxPins = ["resistor", "capacitor", "diode", "led", "crystal"].includes(symbol) ? 2 : 12;
    const pins = (Array.isArray(p.pins) ? p.pins : [])
      .filter((x: any) => x && netName(x.net))
      .slice(0, maxPins)
      .map((x: any) => ({ name: String(x.name ?? "").slice(0, 10), net: netName(x.net) }));
    if (pins.length === 0) continue;
    used.add(p.component); designators.add(designator);
    parts.push({ component: p.component, designator, symbol, label: String(p.label ?? "").slice(0, 40), pins });
  }
  if (parts.length === 0) throw new Error("Invalid netlist.");
  const declared = new Map<string, "power" | "ground" | "signal">();
  for (const n of Array.isArray(v.nets) ? v.nets : []) {
    const name = netName(n?.name);
    if (name) declared.set(name, ["power", "ground", "signal"].includes(n.kind) ? n.kind : "signal");
  }
  const nets = [...new Set(parts.flatMap(p => p.pins.map(x => x.net)))].map(name => ({
    name,
    kind: declared.get(name) ?? (/^(GND|VSS|AGND|DGND)/.test(name) ? "ground" : /^(V|\d+V\d*)/.test(name) ? "power" : "signal"),
  })) as Netlist["nets"];
  return {
    title: typeof v.title === "string" ? v.title.slice(0, 100) : "Schematic",
    parts,
    nets,
    notes: (Array.isArray(v.notes) ? v.notes : []).filter((n: unknown) => typeof n === "string").slice(0, 6).map((n: string) => n.slice(0, 240)),
  };
}

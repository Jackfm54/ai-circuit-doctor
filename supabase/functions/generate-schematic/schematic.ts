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

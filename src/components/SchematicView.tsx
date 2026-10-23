import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Workflow, Download, Loader2, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { ComponentStatus } from "./DiagnosticResult";
import { NetlistSchematic, type Netlist } from "./NetlistSchematic";

export type BlockKind = "power" | "protection" | "processor" | "memory" | "communication" | "interface" | "clock" | "passive" | "other";
export interface Schematic {
  title: string;
  blocks: { id: string; name: string; kind: BlockKind; components: number[]; status: "ok" | "warning" | "fault"; note?: string }[];
  connections: { from: string; to: string; signal: string; type: "power" | "data" | "ground" | "analog" | "rf" }[];
  notes: string[];
}

interface Props {
  components: ComponentStatus[];
  summary: string;
  imageUrl?: string;
  reportId?: string;
  initialSchematic?: Schematic | null;
  initialNetlist?: Netlist | null;
}

// Drawing-sheet palette: the schematic is an exported technical document (SVG file),
// so it carries its own fixed engineering colours instead of app theme tokens.
const INK = "#1b2430";
const SHEET = "#ffffff";
const GRID = "#e8edf2";
const LINK_COLORS = { power: "#c0392b", ground: "#2c3e50", data: "#1f6fb2", analog: "#8e44ad", rf: "#16a085" };
const STATUS_COLORS = { ok: "#2e8b57", warning: "#d68910", fault: "#c0392b" };
const COLUMN: Record<BlockKind, number> = { power: 0, protection: 0, clock: 0, processor: 1, memory: 1, passive: 1, other: 1, communication: 2, interface: 2 };

const W = 1240, BLOCK_W = 300, HEADER = 34, LINE = 17, MAX_LINES = 6, GAP_Y = 48, TOP = 90;
const COL_X = [50, 470, 890];

async function toBase64(url: string): Promise<{ data: string; mime: string }> {
  const blob = await (await fetch(url)).blob();
  const dataUrl: string = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(blob); });
  return { data: dataUrl.split(",")[1], mime: blob.type || "image/jpeg" };
}

function layout(s: Schematic, components: ComponentStatus[]) {
  const colY = [TOP, TOP, TOP];
  const boxes = new Map<string, { x: number; y: number; h: number; lines: string[] }>();
  for (const b of s.blocks) {
    const col = COLUMN[b.kind] ?? 1;
    const names = b.components.map(n => `${n}. ${components[n - 1]?.name ?? ""}`);
    const lines = names.length > MAX_LINES ? [...names.slice(0, MAX_LINES - 1), `+ ${names.length - MAX_LINES + 1}`] : names;
    const h = HEADER + 14 + Math.max(1, lines.length) * LINE + 10;
    boxes.set(b.id, { x: COL_X[col], y: colY[col], h, lines });
    colY[col] += h + GAP_Y;
  }
  const height = Math.max(...colY) + 150;
  return { boxes, height };
}

function trim(text: string, max: number) { return text.length > max ? text.slice(0, max - 1) + "…" : text; }

export function SchematicView({ components, summary, imageUrl, reportId, initialSchematic, initialNetlist }: Props) {
  const { t, language } = useLanguage();
  const [schematic, setSchematic] = useState<Schematic | null>(initialSchematic ?? null);
  const [netlist, setNetlist] = useState<Netlist | null>(initialNetlist ?? null);
  const [mode, setMode] = useState<"detailed" | "blocks">("detailed");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const img = imageUrl ? await toBase64(imageUrl) : null;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-schematic`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ image: img?.data, imageMimeType: img?.mime, components, summary, language, mode }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || t.schematic.error);
      if (mode === "detailed") setNetlist(body); else setSchematic(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.schematic.error);
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!svgRef.current) return;
    const xml = new XMLSerializer().serializeToString(svgRef.current);
    const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportId ?? "circuitdiag"}-${mode === "detailed" ? "schema-detaille" : "schema-blocs"}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const view = schematic ? layout(schematic, components) : null;
  const current = mode === "detailed" ? netlist : schematic;
  const dateText = new Date().toLocaleDateString(language === "en" ? "en-CA" : "fr-CA");

  return (
    <Card className="border-primary/20 print-break-avoid">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Workflow className="w-5 h-5 text-primary" />
            {t.schematic.title}
          </CardTitle>
          <div className="no-print flex gap-2">
            {current && (
              <Button variant="outline" size="sm" onClick={download}>
                <Download className="w-4 h-4" />
                {t.schematic.download}
              </Button>
            )}
            <Button variant="tech" size="sm" onClick={generate} disabled={loading || components.length === 0}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Workflow className="w-4 h-4" />}
              {loading ? t.schematic.generating : current ? t.schematic.regenerate : t.schematic.generate}
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{mode === "detailed" ? t.schematic.detailedDescription : t.schematic.description}</p>
        <div className="no-print inline-flex rounded-md border border-border p-0.5 w-fit">
          {(["detailed", "blocks"] as const).map(m => (
            <Button key={m} size="sm" variant={mode === m ? "secondary" : "ghost"} onClick={() => { setMode(m); setError(null); }} aria-pressed={mode === m}>
              {m === "detailed" ? t.schematic.modeDetailed : t.schematic.modeBlocks}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {error && <p role="alert" className="text-sm text-destructive mb-3">{error}</p>}
        {!current && !loading && <p className="text-sm text-muted-foreground">{t.schematic.empty}</p>}
        {loading && !current && <div className="h-40 rounded-lg border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin mr-2" />{t.schematic.generating}</div>}
        {mode === "detailed" && netlist && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <NetlistSchematic ref={svgRef} netlist={netlist} inferredText={t.schematic.inferred} reportId={reportId} dateText={dateText} legend={{ power: t.schematic.links.power, ground: t.schematic.links.ground, signal: t.schematic.links.data }} sheetTitle={t.schematic.detailedTitle} />
          </div>
        )}
        {mode === "blocks" && schematic && view && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${view.height}`} className="w-full min-w-[760px] h-auto" fontFamily="IBM Plex Mono, monospace">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke={GRID} strokeWidth="1" /></pattern>
                {Object.entries(LINK_COLORS).map(([k, c]) => (
                  <marker key={k} id={`arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill={c} /></marker>
                ))}
              </defs>
              <rect width={W} height={view.height} fill={SHEET} />
              <rect width={W} height={view.height} fill="url(#grid)" />
              <rect x="12" y="12" width={W - 24} height={view.height - 24} fill="none" stroke={INK} strokeWidth="2" />
              <text x="30" y="48" fontSize="20" fontWeight="600" fill={INK} fontFamily="Space Grotesk, sans-serif">{trim(schematic.title, 70)}</text>
              <text x="30" y="68" fontSize="11" fill="#5d6d7e">{t.schematic.inferred}</text>

              {/* Connections */}
              {schematic.connections.map((c, i) => {
                const a = view.boxes.get(c.from), b = view.boxes.get(c.to);
                if (!a || !b) return null;
                const color = LINK_COLORS[c.type];
                const offset = (i % 5) * 6 - 12;
                let d: string, lx: number, ly: number;
                if (a.x === b.x) {
                  const x = a.x - 18 - (i % 3) * 8;
                  const y1 = a.y + a.h / 2 + offset, y2 = b.y + b.h / 2 + offset;
                  d = `M${a.x} ${y1}H${x}V${y2}H${b.x}`;
                  lx = x - 4; ly = (y1 + y2) / 2;
                } else {
                  const leftToRight = a.x < b.x;
                  const x1 = leftToRight ? a.x + BLOCK_W : a.x, x2 = leftToRight ? b.x : b.x + BLOCK_W;
                  const y1 = a.y + HEADER + 20 + offset, y2 = b.y + HEADER + 20 + offset;
                  const mid = (x1 + x2) / 2 + offset;
                  d = `M${x1} ${y1}H${mid}V${y2}H${x2}`;
                  lx = mid + 4; ly = (y1 + y2) / 2;
                }
                return (
                  <g key={i}>
                    <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeDasharray={c.type === "ground" ? "6 4" : undefined} markerEnd={`url(#arrow-${c.type})`} />
                    <text x={lx} y={ly} fontSize="10" fill={color} textAnchor={a.x === b.x ? "end" : "start"} paintOrder="stroke" stroke={SHEET} strokeWidth="3">{trim(c.signal, 22)}</text>
                  </g>
                );
              })}

              {/* Blocks */}
              {schematic.blocks.map(b => {
                const box = view.boxes.get(b.id);
                if (!box) return null;
                return (
                  <g key={b.id}>
                    <rect x={box.x} y={box.y} width={BLOCK_W} height={box.h} fill={SHEET} stroke={INK} strokeWidth="1.6" />
                    <rect x={box.x} y={box.y} width={BLOCK_W} height={HEADER} fill="#f2f5f8" stroke={INK} strokeWidth="1.6" />
                    <circle cx={box.x + BLOCK_W - 14} cy={box.y + HEADER / 2} r="5" fill={STATUS_COLORS[b.status]} />
                    <text x={box.x + 10} y={box.y + 15} fontSize="12" fontWeight="600" fill={INK} fontFamily="Space Grotesk, sans-serif">{trim(b.name, 36)}</text>
                    <text x={box.x + 10} y={box.y + 28} fontSize="9" fill="#5d6d7e">{t.schematic.kinds[b.kind].toUpperCase()}</text>
                    {(box.lines.length ? box.lines : ["—"]).map((line, i) => (
                      <text key={i} x={box.x + 12} y={box.y + HEADER + 20 + i * LINE} fontSize="10.5" fill={INK}>{trim(line, 40)}</text>
                    ))}
                  </g>
                );
              })}

              {/* Legend + title block */}
              <g transform={`translate(30 ${view.height - 110})`}>
                {(Object.keys(LINK_COLORS) as (keyof typeof LINK_COLORS)[]).map((k, i) => (
                  <g key={k} transform={`translate(${i * 120} 0)`}>
                    <line x1="0" y1="0" x2="28" y2="0" stroke={LINK_COLORS[k]} strokeWidth="2" strokeDasharray={k === "ground" ? "6 4" : undefined} />
                    <text x="34" y="4" fontSize="10" fill={INK}>{t.schematic.links[k]}</text>
                  </g>
                ))}
              </g>
              <g transform={`translate(${W - 412} ${view.height - 92})`}>
                <rect width="380" height="68" fill={SHEET} stroke={INK} strokeWidth="1.6" />
                <line x1="0" y1="34" x2="380" y2="34" stroke={INK} />
                <line x1="190" y1="34" x2="190" y2="68" stroke={INK} />
                <text x="10" y="22" fontSize="13" fontWeight="600" fill={INK} fontFamily="Space Grotesk, sans-serif">CircuitDiag — {t.schematic.title}</text>
                <text x="10" y="55" fontSize="10" fill={INK}>{reportId ?? "—"}</text>
                <text x="200" y="55" fontSize="10" fill={INK}>{new Date().toLocaleDateString(language === "en" ? "en-CA" : "fr-CA")}</text>
              </g>
            </svg>
          </div>
        )}
        {current && current.notes.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
            {current.notes.map((n, i) => <li key={i} className="flex gap-2"><AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />{n}</li>)}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

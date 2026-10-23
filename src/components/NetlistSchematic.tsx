import { forwardRef } from "react";

export type PartSymbol = "resistor" | "capacitor" | "diode" | "led" | "crystal" | "transistor" | "ic" | "connector" | "switch" | "other";
export interface Netlist {
  title: string;
  parts: { component: number; designator: string; symbol: PartSymbol; label: string; pins: { name: string; net: string }[] }[];
  nets: { name: string; kind: "power" | "ground" | "signal" }[];
  notes: string[];
}

// Fixed drawing-sheet palette: exported technical document, not themed UI.
const INK = "#1b2430", SHEET = "#ffffff", GRID = "#eef2f6", MUTED = "#5d6d7e";
const NET_COLORS = { power: "#c0392b", ground: "#2c3e50", signal: "#1f6fb2" };
const W = 1240, MARGIN = 40, TOP = 96, ROW_GAP = 36;
const TWO_PIN = ["resistor", "capacitor", "diode", "led", "crystal"];
const ORDER: Record<PartSymbol, number> = { ic: 0, connector: 1, transistor: 2, switch: 3, other: 4, crystal: 5, diode: 6, led: 7, resistor: 8, capacitor: 9 };

function trim(t: string, n: number) { return t.length > n ? t.slice(0, n - 1) + "…" : t; }

/** Net flag drawn at (x,y): power = bar + name, ground = earth symbol, signal = label flag. dir: up/down/left/right. */
function NetFlag({ x, y, name, kind, dir }: { x: number; y: number; name: string; kind: "power" | "ground" | "signal"; dir: "up" | "down" | "left" | "right" }) {
  const c = NET_COLORS[kind];
  if (kind === "ground") {
    const s = dir === "up" ? -1 : 1;
    const vertical = dir === "up" || dir === "down";
    if (vertical) return (<g stroke={c} strokeWidth="1.6"><line x1={x - 9} y1={y} x2={x + 9} y2={y} /><line x1={x - 6} y1={y + 4 * s} x2={x + 6} y2={y + 4 * s} /><line x1={x - 3} y1={y + 8 * s} x2={x + 3} y2={y + 8 * s} /></g>);
    const h = dir === "left" ? -1 : 1;
    return (<g stroke={c} strokeWidth="1.6"><line x1={x} y1={y - 9} x2={x} y2={y + 9} /><line x1={x + 4 * h} y1={y - 6} x2={x + 4 * h} y2={y + 6} /><line x1={x + 8 * h} y1={y - 3} x2={x + 8 * h} y2={y + 3} /></g>);
  }
  if (kind === "power" && (dir === "up" || dir === "down")) {
    const ty = dir === "up" ? y - 6 : y + 14;
    return (<g><line x1={x - 10} y1={y} x2={x + 10} y2={y} stroke={c} strokeWidth="2" /><text x={x} y={ty} fontSize="10" fontWeight="600" fill={c} textAnchor="middle">{name}</text></g>);
  }
  const label = trim(name, 12);
  const w = label.length * 6.4 + 14;
  if (dir === "left") return (<g><path d={`M${x} ${y} l-6 -7 h${-w} v14 h${w} z`} fill={SHEET} stroke={c} strokeWidth="1.2" /><text x={x - 8} y={y + 3.5} fontSize="9.5" fill={c} textAnchor="end">{label}</text></g>);
  if (dir === "right") return (<g><path d={`M${x} ${y} l6 -7 h${w} v14 h${-w} z`} fill={SHEET} stroke={c} strokeWidth="1.2" /><text x={x + 8} y={y + 3.5} fontSize="9.5" fill={c}>{label}</text></g>);
  const ty = dir === "up" ? y - 9 : y + 9;
  return (<g><rect x={x - w / 2} y={ty - 7} width={w} height="14" fill={SHEET} stroke={c} strokeWidth="1.2" rx="2" /><text x={x} y={ty + 3.5} fontSize="9.5" fill={c} textAnchor="middle">{label}</text></g>);
}

function TwoPinBody({ symbol, cx, cy }: { symbol: PartSymbol; cx: number; cy: number }) {
  const p = { stroke: INK, strokeWidth: 1.8, fill: "none" } as const;
  switch (symbol) {
    case "resistor": return <rect x={cx - 7} y={cy - 20} width="14" height="40" {...p} fill={SHEET} />;
    case "capacitor": return <g {...p}><line x1={cx} y1={cy - 20} x2={cx} y2={cy - 4} /><line x1={cx - 14} y1={cy - 4} x2={cx + 14} y2={cy - 4} /><line x1={cx - 14} y1={cy + 4} x2={cx + 14} y2={cy + 4} /><line x1={cx} y1={cy + 4} x2={cx} y2={cy + 20} /></g>;
    case "crystal": return <g {...p}><line x1={cx} y1={cy - 20} x2={cx} y2={cy - 12} /><line x1={cx - 12} y1={cy - 12} x2={cx + 12} y2={cy - 12} /><rect x={cx - 8} y={cy - 7} width="16" height="14" fill={SHEET} /><line x1={cx - 12} y1={cy + 12} x2={cx + 12} y2={cy + 12} /><line x1={cx} y1={cy + 12} x2={cx} y2={cy + 20} /></g>;
    default: return (
      <g {...p}>
        <line x1={cx} y1={cy - 20} x2={cx} y2={cy - 8} />
        <path d={`M${cx - 10} ${cy - 8} H${cx + 10} L${cx} ${cy + 8} Z`} fill={SHEET} />
        <line x1={cx - 10} y1={cy + 8} x2={cx + 10} y2={cy + 8} />
        <line x1={cx} y1={cy + 8} x2={cx} y2={cy + 20} />
        {symbol === "led" && <g strokeWidth="1.2"><path d={`M${cx + 12} ${cy - 4} l8 -8 M${cx + 16} ${cy + 2} l8 -8`} /><path d={`M${cx + 20} ${cy - 12} l-4 0 l4 4z M${cx + 24} ${cy - 6} l-4 0 l4 4z`} fill={INK} /></g>}
      </g>
    );
  }
}

function layout(parts: Netlist["parts"]) {
  const sorted = [...parts].sort((a, b) => ORDER[a.symbol] - ORDER[b.symbol]);
  const cells: { part: Netlist["parts"][number]; x: number; y: number; w: number; h: number }[] = [];
  let x = MARGIN, y = TOP, rowH = 0;
  for (const part of sorted) {
    const two = TWO_PIN.includes(part.symbol);
    const side = Math.ceil(part.pins.length / 2);
    const w = two ? 130 : 330;
    const h = two ? 170 : 70 + side * 24;
    if (x + w > W - MARGIN) { x = MARGIN; y += rowH + ROW_GAP; rowH = 0; }
    cells.push({ part, x, y, w, h });
    x += w + 20; rowH = Math.max(rowH, h);
  }
  return { cells, height: y + rowH + 150 };
}

export const NetlistSchematic = forwardRef<SVGSVGElement, { netlist: Netlist; inferredText: string; reportId?: string; dateText: string; legend: Record<"power" | "ground" | "signal", string>; sheetTitle: string }>(
  function NetlistSchematic({ netlist, inferredText, reportId, dateText, legend, sheetTitle }, ref) {
    const kind = new Map(netlist.nets.map(n => [n.name, n.kind]));
    const k = (net: string) => kind.get(net) ?? "signal";
    const { cells, height } = layout(netlist.parts);
    return (
      <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${height}`} className="w-full min-w-[760px] h-auto" fontFamily="IBM Plex Mono, monospace">
        <defs><pattern id="nl-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke={GRID} strokeWidth="1" /></pattern></defs>
        <rect width={W} height={height} fill={SHEET} />
        <rect width={W} height={height} fill="url(#nl-grid)" />
        <rect x="12" y="12" width={W - 24} height={height - 24} fill="none" stroke={INK} strokeWidth="2" />
        <text x="30" y="48" fontSize="20" fontWeight="600" fill={INK} fontFamily="Space Grotesk, sans-serif">{trim(netlist.title, 70)}</text>
        <text x="30" y="68" fontSize="11" fill={MUTED}>{inferredText}</text>

        {cells.map(({ part, x, y, w, h }) => {
          if (TWO_PIN.includes(part.symbol)) {
            const cx = x + 40, cy = y + h / 2;
            const [p1, p2] = [part.pins[0], part.pins[1] ?? { name: "", net: "GND" }];
            const k1 = k(p1.net), k2 = k(p2.net);
            return (
              <g key={part.designator}>
                <line x1={cx} y1={cy - 50} x2={cx} y2={cy - 20} stroke={INK} strokeWidth="1.8" />
                <line x1={cx} y1={cy + 20} x2={cx} y2={cy + 50} stroke={INK} strokeWidth="1.8" />
                <TwoPinBody symbol={part.symbol} cx={cx} cy={cy} />
                <circle cx={cx} cy={cy - 50} r="2.2" fill={INK} /><circle cx={cx} cy={cy + 50} r="2.2" fill={INK} />
                <NetFlag x={cx} y={cy - 50} name={p1.net} kind={k1} dir="up" />
                <NetFlag x={cx} y={cy + 50} name={p2.net} kind={k2 === "power" ? "signal" : k2} dir="down" />
                <text x={cx + 20} y={cy - 4} fontSize="12" fontWeight="600" fill={INK}>{part.designator}</text>
                <text x={cx + 20} y={cy + 10} fontSize="9" fill={MUTED}>#{part.component}</text>
                <text x={cx + 20} y={cy + 22} fontSize="9" fill={MUTED}>{trim(part.label, 12)}</text>
              </g>
            );
          }
          const side = Math.ceil(part.pins.length / 2);
          const bx = x + 95, bw = w - 190, by = y + 34, bh = side * 24 + 16;
          return (
            <g key={part.designator}>
              <text x={bx} y={y + 14} fontSize="12" fontWeight="600" fill={INK}>{part.designator} <tspan fontSize="9" fontWeight="400" fill={MUTED}>#{part.component}</tspan></text>
              <text x={bx} y={y + 27} fontSize="9.5" fill={MUTED}>{trim(part.label, 26)}</text>
              <rect x={bx} y={by} width={bw} height={bh} fill="#fbfcfd" stroke={INK} strokeWidth="1.8" />
              {part.pins.map((pin, i) => {
                const left = i < side;
                const row = left ? i : i - side;
                const py = by + 20 + row * 24;
                const x1 = left ? bx : bx + bw, x2 = left ? bx - 22 : bx + bw + 22;
                return (
                  <g key={i}>
                    <line x1={x1} y1={py} x2={x2} y2={py} stroke={INK} strokeWidth="1.6" />
                    <text x={left ? bx + 6 : bx + bw - 6} y={py + 3.5} fontSize="9.5" fill={INK} textAnchor={left ? "start" : "end"}>{trim(pin.name, 9)}</text>
                    <NetFlag x={x2} y={py} name={pin.net} kind={k(pin.net)} dir={left ? "left" : "right"} />
                  </g>
                );
              })}
            </g>
          );
        })}

        <g transform={`translate(30 ${height - 100})`}>
          {(["power", "ground", "signal"] as const).map((kk, i) => (
            <g key={kk} transform={`translate(${i * 150} 0)`}>
              <line x1="0" y1="0" x2="26" y2="0" stroke={NET_COLORS[kk]} strokeWidth="2" />
              <text x="32" y="4" fontSize="10" fill={INK}>{legend[kk]}</text>
            </g>
          ))}
          <text x="0" y="24" fontSize="9.5" fill={MUTED}>{netlist.parts.length} parts · {netlist.nets.length} nets</text>
        </g>
        <g transform={`translate(${W - 412} ${height - 92})`}>
          <rect width="380" height="68" fill={SHEET} stroke={INK} strokeWidth="1.6" />
          <line x1="0" y1="34" x2="380" y2="34" stroke={INK} />
          <line x1="190" y1="34" x2="190" y2="68" stroke={INK} />
          <text x="10" y="22" fontSize="13" fontWeight="600" fill={INK} fontFamily="Space Grotesk, sans-serif">CircuitDiag — {sheetTitle}</text>
          <text x="10" y="55" fontSize="10" fill={INK}>{reportId ?? "—"}</text>
          <text x="200" y="55" fontSize="10" fill={INK}>{dateText}</text>
        </g>
      </svg>
    );
  },
);

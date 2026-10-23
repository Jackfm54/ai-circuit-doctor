import { forwardRef } from "react";

export type PartSymbol = "resistor" | "capacitor" | "diode" | "led" | "crystal" | "transistor" | "ic" | "connector" | "switch" | "other";
export interface Netlist {
  title: string;
  parts: { component: number; designator: string; symbol: PartSymbol; label: string; pins: { name: string; net: string }[] }[];
  nets: { name: string; kind: "power" | "ground" | "signal" }[];
  notes: string[];
}

// Classic EDA (KiCad-like) drawing palette: the schematic is an exported technical
// document, so it uses fixed engineering colours instead of app theme tokens.
const SHEET = "#fffff6", GRID = "#f0efe4", FRAME = "#7a1f1f";
const WIRE = "#008400";       // wires
const BODY = "#840000";       // symbol outlines
const BODY_FILL = "#ffffc2";  // IC body fill
const PIN_TXT = "#008484";    // pin names / numbers, net labels
const REF_TXT = "#006464";    // designators
const MUTED = "#5d6d7e";
const W = 1400, GAP = 78, TOP = 110, TRACK = 7, CH_PAD = 14;
const TWO_PIN = ["resistor", "capacitor", "diode", "led", "crystal", "switch"];
const ORDER: Record<PartSymbol, number> = { ic: 0, connector: 1, transistor: 2, other: 3, crystal: 4, switch: 5, diode: 6, led: 7, resistor: 8, capacitor: 9 };

type Part = Netlist["parts"][number];
interface Cell { part: Part; x: number; w: number; h: number; row: number; y: number; two: boolean }
interface PinEnd { net: string; x: number; y: number; route: "left" | "right" | "down" | "upLeft"; cell: Cell }

function trim(t: string, n: number) { return t.length > n ? t.slice(0, n - 1) + "…" : t; }
const isTwo = (p: Part) => TWO_PIN.includes(p.symbol) && p.pins.length <= 2;

function TwoPinBody({ symbol, cx, cy }: { symbol: PartSymbol; cx: number; cy: number }) {
  const p = { stroke: BODY, strokeWidth: 1.8, fill: "none", strokeLinejoin: "round" as const };
  switch (symbol) {
    case "resistor": {
      const zig = Array.from({ length: 6 }, (_, i) => `L${cx + (i % 2 === 0 ? 7 : -7)} ${cy - 15 + i * 6 + 3}`).join(" ");
      return <path d={`M${cx} ${cy - 20} V${cy - 15} ${zig} L${cx} ${cy + 18} V${cy + 20}`} {...p} />;
    }
    case "capacitor": return <g {...p}><line x1={cx} y1={cy - 20} x2={cx} y2={cy - 4} /><line x1={cx - 13} y1={cy - 4} x2={cx + 13} y2={cy - 4} strokeWidth="2.4" /><line x1={cx - 13} y1={cy + 4} x2={cx + 13} y2={cy + 4} strokeWidth="2.4" /><line x1={cx} y1={cy + 4} x2={cx} y2={cy + 20} /></g>;
    case "crystal": return <g {...p}><line x1={cx} y1={cy - 20} x2={cx} y2={cy - 11} /><line x1={cx - 11} y1={cy - 11} x2={cx + 11} y2={cy - 11} /><rect x={cx - 7} y={cy - 6} width="14" height="12" fill={SHEET} /><line x1={cx - 11} y1={cy + 11} x2={cx + 11} y2={cy + 11} /><line x1={cx} y1={cy + 11} x2={cx} y2={cy + 20} /></g>;
    case "switch": return <g {...p}><line x1={cx} y1={cy - 20} x2={cx} y2={cy - 10} /><circle cx={cx} cy={cy - 8} r="2" /><circle cx={cx} cy={cy + 8} r="2" /><line x1={cx} y1={cy + 10} x2={cx} y2={cy + 20} /><line x1={cx - 6} y1={cy - 10} x2={cx - 6} y2={cy + 10} /><line x1={cx - 6} y1={cy} x2={cx - 13} y2={cy} /></g>;
    default: return (
      <g {...p}>
        <line x1={cx} y1={cy - 20} x2={cx} y2={cy - 8} />
        <path d={`M${cx - 9} ${cy - 8} H${cx + 9} L${cx} ${cy + 7} Z`} fill={BODY} />
        <line x1={cx - 9} y1={cy + 7} x2={cx + 9} y2={cy + 7} />
        <line x1={cx} y1={cy + 7} x2={cx} y2={cy + 20} />
        {symbol === "led" && <g strokeWidth="1.2"><path d={`M${cx + 11} ${cy - 3} l8 -8 M${cx + 15} ${cy + 3} l8 -8`} /><path d={`M${cx + 19} ${cy - 11} l-4 0 l4 4z M${cx + 23} ${cy - 5} l-4 0 l4 4z`} fill={BODY} /></g>}
      </g>
    );
  }
}

function GroundSym({ x, y }: { x: number; y: number }) {
  return <g stroke={WIRE} strokeWidth="1.6"><line x1={x} y1={y} x2={x} y2={y + 6} /><line x1={x - 9} y1={y + 6} x2={x + 9} y2={y + 6} /><line x1={x - 6} y1={y + 10} x2={x + 6} y2={y + 10} /><line x1={x - 3} y1={y + 14} x2={x + 3} y2={y + 14} /></g>;
}

function NetFlag({ x, y, name, kind, dir }: { x: number; y: number; name: string; kind: string; dir: "left" | "right" | "up" | "down" }) {
  if (kind === "ground") return dir === "up" ? <g transform={`rotate(180 ${x} ${y})`}><GroundSym x={x} y={y} /></g> : <GroundSym x={x} y={y} />;
  const label = trim(name, 12);
  const w = label.length * 6.2 + 12;
  if (dir === "left") return <g><path d={`M${x} ${y} l-6 -6 h${-w} v12 h${w} z`} fill={SHEET} stroke={PIN_TXT} strokeWidth="1" /><text x={x - 8} y={y + 3.5} fontSize="9.5" fill={PIN_TXT} textAnchor="end">{label}</text></g>;
  if (dir === "right") return <g><path d={`M${x} ${y} l6 -6 h${w} v12 h${-w} z`} fill={SHEET} stroke={PIN_TXT} strokeWidth="1" /><text x={x + 8} y={y + 3.5} fontSize="9.5" fill={PIN_TXT}>{label}</text></g>;
  const ty = dir === "up" ? y - 4 : y + 13;
  return <g>{kind === "power" && <line x1={x - 9} y1={y} x2={x + 9} y2={y} stroke={WIRE} strokeWidth="2" />}<text x={x} y={ty} fontSize="9.5" fontWeight="600" fill={PIN_TXT} textAnchor="middle">{label}</text></g>;
}

/** Places parts in rows, then routes every multi-pin net with orthogonal wires: pin → gap between parts → horizontal track in the channel under the row → shared left-margin spine between rows. */
function build(netlist: Netlist) {
  const kind = new Map(netlist.nets.map(n => [n.name, n.kind]));
  const parts = [...netlist.parts].sort((a, b) => ORDER[a.symbol] - ORDER[b.symbol]);
  const pinCount = new Map<string, number>();
  parts.forEach(p => p.pins.forEach(pin => pinCount.set(pin.net, (pinCount.get(pin.net) ?? 0) + 1)));
  const wired = (net: string) => (pinCount.get(net) ?? 0) >= 2;

  // Nets spanning several rows need a spine slot in the left margin; reserve room first.
  const cells: Cell[] = [];
  const provisionalMargin = 220; // upper bound of the spine area; cells shift left once the real width is known
  let x = provisionalMargin + GAP, row = 0;
  const rowHeights: number[] = [0];
  for (const part of parts) {
    const two = isTwo(part);
    const side = Math.ceil(part.pins.length / 2);
    const w = two ? 70 : 230;
    const h = two ? 150 : 64 + side * 22;
    if (x + w > W - 40) { row++; rowHeights[row] = 0; x = provisionalMargin + GAP; }
    cells.push({ part, x, w, h, row, y: 0, two });
    rowHeights[row] = Math.max(rowHeights[row], h);
    x += w + GAP;
  }
  const rows = row + 1;
  const netRows = new Map<string, Set<number>>();
  cells.forEach(c => c.part.pins.forEach(p => { if (wired(p.net)) { if (!netRows.has(p.net)) netRows.set(p.net, new Set()); netRows.get(p.net)!.add(c.row); } }));
  const spineNets = [...netRows].filter(([, r]) => r.size > 1).map(([n]) => n);
  const margin = Math.min(provisionalMargin, 40 + spineNets.length * 6 + 20);
  const shift = margin - provisionalMargin;
  cells.forEach(c => { c.x += shift; });
  const spineX = (net: string) => 40 + 10 + spineNets.indexOf(net) * 6;

  // Tracks per channel (channel r sits under row r).
  const channelNets: string[][] = Array.from({ length: rows }, () => []);
  netRows.forEach((r, net) => r.forEach(ri => channelNets[ri].push(net)));
  const rowY: number[] = [], chTop: number[] = [];
  let y = TOP;
  for (let r = 0; r < rows; r++) {
    rowY[r] = y;
    chTop[r] = y + rowHeights[r] + 10;
    y = chTop[r] + CH_PAD * 2 + channelNets[r].length * TRACK + 26;
  }
  cells.forEach(c => { c.y = rowY[c.row] + 18; });
  const trackY = (r: number, net: string) => chTop[r] + CH_PAD + channelNets[r].indexOf(net) * TRACK;

  // Pin endpoints.
  const ends: PinEnd[] = [];
  const flags: { x: number; y: number; net: string; dir: "left" | "right" | "up" | "down" }[] = [];
  for (const c of cells) {
    if (c.two) {
      const cx = c.x + 22, cy = c.y + c.h / 2 - 10;
      const [p1, p2] = [c.part.pins[0], c.part.pins[1]];
      if (p1) wired(p1.net) ? ends.push({ net: p1.net, x: cx, y: cy - 44, route: "upLeft", cell: c }) : flags.push({ x: cx, y: cy - 44, net: p1.net, dir: "up" });
      if (p2) wired(p2.net) ? ends.push({ net: p2.net, x: cx, y: cy + 44, route: "down", cell: c }) : flags.push({ x: cx, y: cy + 44, net: p2.net, dir: "down" });
    } else {
      const side = Math.ceil(c.part.pins.length / 2);
      const bx = c.x + 45, bw = c.w - 90, by = c.y + 30;
      c.part.pins.forEach((pin, i) => {
        const left = i < side;
        const py = by + 18 + (left ? i : i - side) * 22;
        const px = left ? bx - 24 : bx + bw + 24;
        if (wired(pin.net)) ends.push({ net: pin.net, x: px, y: py, route: left ? "left" : "right", cell: c });
        else flags.push({ x: px, y: py, net: pin.net, dir: left ? "left" : "right" });
      });
    }
  }

  // Gap slots so parallel verticals never overlap.
  const gapSlots = new Map<string, string[]>();
  const slotX = (gapKey: string, gapLeft: number, net: string) => {
    const list = gapSlots.get(gapKey) ?? [];
    if (!list.includes(net)) list.push(net);
    gapSlots.set(gapKey, list);
    return gapLeft + 10 + (list.indexOf(net) % 12) * 5;
  };

  const wires: string[] = [];
  const dots: { x: number; y: number }[] = [];
  const trackSpan = new Map<string, { min: number; max: number; drops: number }>();
  const touch = (r: number, net: string, xx: number) => {
    const k = `${r}|${net}`;
    const s = trackSpan.get(k) ?? { min: xx, max: xx, drops: 0 };
    s.min = Math.min(s.min, xx); s.max = Math.max(s.max, xx); s.drops++;
    trackSpan.set(k, s);
  };

  for (const e of ends) {
    const r = e.cell.row, ty = trackY(r, e.net);
    if (e.route === "down") {
      wires.push(`M${e.x} ${e.y}V${ty}`);
      touch(r, e.net, e.x);
      continue;
    }
    const goLeft = e.route === "left" || e.route === "upLeft";
    const gapLeft = goLeft ? e.cell.x - GAP : e.cell.x + e.cell.w;
    const gx = slotX(`${r}|${gapLeft}`, gapLeft, e.net);
    if (e.route === "upLeft") {
      const upY = e.cell.y - 8 - (gapSlots.get(`${r}|${gapLeft}`)!.indexOf(e.net) % 3) * 3;
      wires.push(`M${e.x} ${e.y}V${upY}H${gx}V${ty}`);
    } else {
      wires.push(`M${e.x} ${e.y}H${gx}V${ty}`);
    }
    touch(r, e.net, gx);
  }

  const labels: { x: number; y: number; net: string }[] = [];
  trackSpan.forEach((s, k) => {
    const [rs, net] = k.split("|");
    const r = Number(rs), ty = trackY(r, net);
    const spine = spineNets.includes(net);
    const x1 = spine ? spineX(net) : s.min;
    wires.push(`M${x1} ${ty}H${s.max}`);
    if (s.drops + (spine ? 1 : 0) > 2 || spine) dots.push({ x: spine ? spineX(net) : s.min, y: ty });
    labels.push({ x: Math.max(x1, s.min) + 4, y: ty - 2, net });
  });
  // Spines linking the same net across channels.
  for (const net of spineNets) {
    const ys = [...netRows.get(net)!].map(r => trackY(r, net));
    wires.push(`M${spineX(net)} ${Math.min(...ys)}V${Math.max(...ys)}`);
  }
  // Junction dots where a drop meets a track with 3+ connections.
  for (const e of ends) {
    const k = `${e.cell.row}|${e.net}`;
    const s = trackSpan.get(k)!;
    if (s.drops > 2 || spineNets.includes(e.net)) {
      const ty = trackY(e.cell.row, e.net);
      const gx = e.route === "down" ? e.x : undefined;
      if (gx !== undefined) dots.push({ x: gx, y: ty });
    }
  }
  const height = y + 130;
  return { cells, wires, dots, flags, labels, height, kind, gapSlots, ends, trackY };
}

export const NetlistSchematic = forwardRef<SVGSVGElement, { netlist: Netlist; inferredText: string; reportId?: string; dateText: string; legend: Record<"power" | "ground" | "signal", string>; sheetTitle: string }>(
  function NetlistSchematic({ netlist, inferredText, reportId, dateText, sheetTitle }, ref) {
    const { cells, wires, dots, flags, labels, height, kind } = build(netlist);
    return (
      <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${height}`} className="w-full min-w-[900px] h-auto" fontFamily="IBM Plex Mono, monospace">
        <defs><pattern id="nl-grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0H0V25" fill="none" stroke={GRID} strokeWidth="1" /></pattern></defs>
        <rect width={W} height={height} fill={SHEET} />
        <rect width={W} height={height} fill="url(#nl-grid)" />
        <rect x="12" y="12" width={W - 24} height={height - 24} fill="none" stroke={FRAME} strokeWidth="2" />
        <rect x="20" y="20" width={W - 40} height={height - 40} fill="none" stroke={FRAME} strokeWidth="0.8" />
        {Array.from({ length: 6 }, (_, i) => <text key={i} x={20 + (W - 40) * (i + 0.5) / 6} y="17" fontSize="8" fill={FRAME} textAnchor="middle">{i + 1}</text>)}
        <text x="40" y="56" fontSize="20" fontWeight="600" fill={BODY} fontFamily="Space Grotesk, sans-serif">{trim(netlist.title, 80)}</text>
        <text x="40" y="76" fontSize="11" fill={MUTED}>{inferredText}</text>

        {/* Wires */}
        <g stroke={WIRE} strokeWidth="1.5" fill="none" strokeLinejoin="round">
          {wires.map((d, i) => <path key={i} d={d} />)}
        </g>
        {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r="3" fill={WIRE} />)}
        {labels.map((l, i) => (
          <text key={i} x={l.x} y={l.y} fontSize="8.5" fill={kind.get(l.net) === "power" ? BODY : PIN_TXT} paintOrder="stroke" stroke={SHEET} strokeWidth="3">{l.net}</text>
        ))}

        {/* Parts */}
        {cells.map(c => {
          if (c.two) {
            const cx = c.x + 22, cy = c.y + c.h / 2 - 10;
            return (
              <g key={c.part.designator}>
                <line x1={cx} y1={cy - 44} x2={cx} y2={cy - 20} stroke={BODY} strokeWidth="1.6" />
                <line x1={cx} y1={cy + 20} x2={cx} y2={cy + 44} stroke={BODY} strokeWidth="1.6" />
                <TwoPinBody symbol={c.part.symbol} cx={cx} cy={cy} />
                <text x={cx + 4} y={cy - 30} fontSize="8" fill={PIN_TXT}>1</text>
                <text x={cx + 4} y={cy + 38} fontSize="8" fill={PIN_TXT}>2</text>
                <text x={cx + 16} y={cy - 2} fontSize="11.5" fontWeight="600" fill={REF_TXT}>{c.part.designator}</text>
                <text x={cx + 16} y={cy + 11} fontSize="8.5" fill={MUTED}>#{c.part.component}</text>
              </g>
            );
          }
          const side = Math.ceil(c.part.pins.length / 2);
          const bx = c.x + 45, bw = c.w - 90, by = c.y + 30, bh = side * 22 + 14;
          return (
            <g key={c.part.designator}>
              <text x={bx} y={c.y + 10} fontSize="11.5" fontWeight="600" fill={REF_TXT}>{c.part.designator} <tspan fontSize="8.5" fontWeight="400" fill={MUTED}>#{c.part.component}</tspan></text>
              <text x={bx} y={c.y + 23} fontSize="9" fill={REF_TXT}>{trim(c.part.label, 22)}</text>
              <rect x={bx} y={by} width={bw} height={bh} fill={BODY_FILL} stroke={BODY} strokeWidth="1.8" />
              {c.part.pins.map((pin, i) => {
                const left = i < side;
                const py = by + 18 + (left ? i : i - side) * 22;
                const x1 = left ? bx : bx + bw, x2 = left ? bx - 24 : bx + bw + 24;
                return (
                  <g key={i}>
                    <line x1={x1} y1={py} x2={x2} y2={py} stroke={BODY} strokeWidth="1.5" />
                    <text x={left ? bx - 12 : bx + bw + 12} y={py - 3} fontSize="7.5" fill={BODY} textAnchor="middle">{i + 1}</text>
                    <text x={left ? bx + 5 : bx + bw - 5} y={py + 3.5} fontSize="9" fill={PIN_TXT} textAnchor={left ? "start" : "end"}>{trim(pin.name, 8)}</text>
                  </g>
                );
              })}
            </g>
          );
        })}
        {flags.map((f, i) => <NetFlag key={i} x={f.x} y={f.y} name={f.net} kind={kind.get(f.net) ?? "signal"} dir={f.dir} />)}

        {/* Title block */}
        <g transform={`translate(${W - 452} ${height - 100})`}>
          <rect width="420" height="72" fill={SHEET} stroke={FRAME} strokeWidth="1.6" />
          <line x1="0" y1="36" x2="420" y2="36" stroke={FRAME} />
          <line x1="210" y1="36" x2="210" y2="72" stroke={FRAME} />
          <text x="10" y="24" fontSize="13" fontWeight="600" fill={BODY} fontFamily="Space Grotesk, sans-serif">CircuitDiag — {sheetTitle}</text>
          <text x="10" y="58" fontSize="10" fill={BODY}>{reportId ?? "—"}</text>
          <text x="220" y="58" fontSize="10" fill={BODY}>{dateText} · {netlist.parts.length} parts · {netlist.nets.length} nets</text>
        </g>
      </svg>
    );
  },
);

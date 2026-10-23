import { describe, expect, test } from "bun:test";
import { normalizeNetlist, normalizeSchematic } from "./schematic";

describe("Schematic normalization", () => {
  test("a component belongs to only one block and must exist on the board", () => {
    const s = normalizeSchematic({ title: "T", notes: [], connections: [], blocks: [
      { id: "a", name: "Power", kind: "power", components: [1, 2, 99], status: "ok" },
      { id: "b", name: "CPU", kind: "processor", components: [2, 3], status: "ok" },
    ] }, 3);
    expect(s.blocks[0].components).toEqual([1, 2]);
    expect(s.blocks[1].components).toEqual([3]);
  });
  test("drops links to blocks that do not exist", () => {
    const s = normalizeSchematic({ title: "T", notes: [], blocks: [{ id: "a", name: "A", kind: "power", components: [], status: "ok" }, { id: "b", name: "B", kind: "x", components: [], status: "ok" }],
      connections: [{ from: "a", to: "b", signal: "5V", type: "power" }, { from: "a", to: "zzz", signal: "X", type: "data" }] }, 1);
    expect(s.connections).toHaveLength(1);
    expect(s.blocks[1].kind).toBe("other");
  });
  test("empty schematic is rejected instead of drawing nothing", () => {
    expect(() => normalizeSchematic({ blocks: [] }, 3)).toThrow();
  });
  test("detailed netlist: passives keep 2 pins, nets are declared and classified", () => {
    const n = normalizeNetlist({ title: "T", notes: [], nets: [], parts: [
      { component: 1, designator: "c1", symbol: "capacitor", label: "MLCC", pins: [{ name: "1", net: "3v3" }, { name: "2", net: "GND" }, { name: "3", net: "X" }] },
      { component: 1, designator: "C2", symbol: "capacitor", label: "dup", pins: [{ name: "1", net: "5V" }] },
      { component: 9, designator: "U1", symbol: "ic", label: "out of range", pins: [{ name: "VCC", net: "3V3" }] },
    ] }, 3);
    expect(n.parts).toHaveLength(1);
    expect(n.parts[0].designator).toBe("C1");
    expect(n.parts[0].pins).toHaveLength(2);
    expect(n.nets).toEqual([{ name: "3V3", kind: "power" }, { name: "GND", kind: "ground" }]);
  });
});

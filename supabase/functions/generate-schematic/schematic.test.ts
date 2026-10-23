import { describe, expect, test } from "bun:test";
import { normalizeSchematic } from "./schematic";

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
});

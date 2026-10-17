import { describe, expect, it } from "vitest";
import {
  blockEdges,
  DEFAULT_BOARD_WIDTH,
  layoutBoard,
  monthBoardItems,
  orientations,
  SHAPE_CELLS,
  type BoardItem,
} from "./board";
import { documentWith } from "./fixtures";
import { toggleHabit } from "./marks";
import { SHAPE_IDS } from "./schema";
import type { ShapeId } from "./types";

const sizes: Record<ShapeId, number> = {
  single: 1,
  domino: 2,
  i: 4,
  o: 4,
  s: 4,
  z: 4,
  t: 4,
  l: 4,
  j: 4,
};

/** A fixed pseudo-random sequence, so the "random" boards are the same on every run. */
function randomItems(seed: number, count: number): BoardItem[] {
  let state = seed;
  const next = () => {
    state = (Math.imul(state, 1_103_515_245) + 12_345) % 2_147_483_648;
    return state;
  };
  return Array.from({ length: count }, (_unused, index) => ({
    key: `item-${String(index)}`,
    shape: SHAPE_IDS[next() % SHAPE_IDS.length] ?? "single",
  }));
}

const BOARDS = [1, 2, 3, 4, 5, 6, 7, 8].flatMap((seed) =>
  [0, 1, 5, 40, 150].map((count) => ({ seed, count })),
);

describe("shapes", () => {
  it("have the right number of cells in every orientation, all starting at 0", () => {
    for (const shape of SHAPE_IDS) {
      expect(SHAPE_CELLS[shape]).toHaveLength(sizes[shape]);
      for (const cells of orientations(shape)) {
        expect(cells).toHaveLength(sizes[shape]);
        expect(Math.min(...cells.map((cell) => cell.x))).toBe(0);
        expect(Math.min(...cells.map((cell) => cell.y))).toBe(0);
      }
    }
  });

  it("have the expected number of distinct orientations", () => {
    const counts = Object.fromEntries(
      SHAPE_IDS.map((shape) => [shape, orientations(shape).length]),
    );
    expect(counts).toEqual({ single: 1, domino: 2, i: 2, o: 1, s: 2, z: 2, t: 4, l: 4, j: 4 });
  });

  it("stay connected when turned", () => {
    for (const shape of SHAPE_IDS) {
      for (const cells of orientations(shape)) {
        const keys = new Set(cells.map((cell) => `${String(cell.x)},${String(cell.y)}`));
        const seen = new Set<string>();
        const stack = [cells[0]];
        while (stack.length > 0) {
          const cell = stack.pop();
          if (!cell) {
            continue;
          }
          const key = `${String(cell.x)},${String(cell.y)}`;
          if (seen.has(key) || !keys.has(key)) {
            continue;
          }
          seen.add(key);
          stack.push(
            { x: cell.x + 1, y: cell.y },
            { x: cell.x - 1, y: cell.y },
            { x: cell.x, y: cell.y + 1 },
            { x: cell.x, y: cell.y - 1 },
          );
        }
        expect(seen.size).toBe(cells.length);
      }
    }
  });
});

describe("layoutBoard", () => {
  it("is empty for no items", () => {
    expect(layoutBoard([])).toEqual({ width: DEFAULT_BOARD_WIDTH, height: 0, blocks: [] });
  });

  it("puts a single square on the floor", () => {
    const layout = layoutBoard([{ key: "a", shape: "single" }]);
    expect(layout.height).toBe(1);
    expect(layout.blocks[0]?.cells).toHaveLength(1);
    expect(layout.blocks[0]?.cells[0]?.y).toBe(0);
  });

  it.each(BOARDS)(
    "never overlaps or leaves the board (seed $seed, $count items)",
    ({ seed, count }) => {
      const layout = layoutBoard(randomItems(seed, count));
      const seen = new Set<string>();
      for (const block of layout.blocks) {
        for (const cell of block.cells) {
          expect(cell.x).toBeGreaterThanOrEqual(0);
          expect(cell.x).toBeLessThan(layout.width);
          expect(cell.y).toBeGreaterThanOrEqual(0);
          expect(cell.y).toBeLessThan(layout.height);
          const key = `${String(cell.x)},${String(cell.y)}`;
          expect(seen.has(key)).toBe(false);
          seen.add(key);
        }
      }
    },
  );

  it.each(BOARDS)(
    "places every item as a whole block of its own shape (seed $seed, $count items)",
    ({ seed, count }) => {
      const items = randomItems(seed, count);
      const layout = layoutBoard(items);
      expect(layout.blocks.map((block) => block.item.key)).toEqual(items.map((item) => item.key));
      for (const block of layout.blocks) {
        expect(block.cells).toHaveLength(sizes[block.item.shape]);
        const minX = Math.min(...block.cells.map((cell) => cell.x));
        const minY = Math.min(...block.cells.map((cell) => cell.y));
        const shape = block.cells
          .map((cell) => `${String(cell.x - minX)},${String(cell.y - minY)}`)
          .toSorted();
        const known = orientations(block.item.shape).map((cells) =>
          cells.map((cell) => `${String(cell.x)},${String(cell.y)}`).toSorted(),
        );
        expect(known).toContainEqual(shape);
      }
    },
  );

  it.each(BOARDS)(
    "lets every block rest on the floor or another block (seed $seed, $count items)",
    ({ seed, count }) => {
      const layout = layoutBoard(randomItems(seed, count));
      const owner = new Map<string, number>();
      for (const [index, block] of layout.blocks.entries()) {
        for (const cell of block.cells) {
          owner.set(`${String(cell.x)},${String(cell.y)}`, index);
        }
      }
      for (const [index, block] of layout.blocks.entries()) {
        const resting = block.cells.some((cell) => {
          if (cell.y === 0) {
            return true;
          }
          const below = owner.get(`${String(cell.x)},${String(cell.y - 1)}`);
          return below !== undefined && below < index;
        });
        expect(resting).toBe(true);
      }
    },
  );

  it.each(BOARDS)(
    "reports the height of the tallest column (seed $seed, $count items)",
    ({ seed, count }) => {
      const layout = layoutBoard(randomItems(seed, count));
      const top = Math.max(
        0,
        ...layout.blocks.flatMap((block) => block.cells.map((cell) => cell.y + 1)),
      );
      expect(layout.height).toBe(top);
    },
  );

  it("gives the same board for the same items, every time", () => {
    const items = randomItems(9, 80);
    expect(layoutBoard(items)).toEqual(layoutBoard(items));
    expect(layoutBoard(items)).toEqual(layoutBoard(items.map((item) => ({ ...item }))));
  });

  it("depends on the order of the items, since earlier blocks come first", () => {
    const items = randomItems(10, 30);
    expect(layoutBoard(items.toReversed())).not.toEqual(layoutBoard(items));
  });

  it("keeps the board compact: few holes and a sensible height", () => {
    const items = randomItems(11, 150);
    const layout = layoutBoard(items);
    const filled = layout.blocks.reduce((total, block) => total + block.cells.length, 0);
    expect(layout.height * layout.width).toBeLessThan(filled * 1.6);
  });

  it("works on a narrower board and skips shapes wider than the board", () => {
    const layout = layoutBoard(
      [
        { key: "a", shape: "i" },
        { key: "b", shape: "o" },
      ],
      3,
    );
    expect(layout.width).toBe(3);
    // The I fits standing up (1 wide, 4 high), so nothing is dropped.
    expect(layout.blocks).toHaveLength(2);
    expect(layoutBoard([{ key: "a", shape: "i" }], 0).blocks).toEqual([]);
  });

  it("fills the floor before it stacks", () => {
    const items: BoardItem[] = Array.from({ length: 10 }, (_unused, index) => ({
      key: `s-${String(index)}`,
      shape: "single",
    }));
    const layout = layoutBoard(items);
    expect(layout.height).toBe(1);
  });
});

describe("monthBoardItems", () => {
  it("lists the habits of a month, by day and then in legend order", () => {
    let doc = documentWith("household");
    doc = toggleHabit(doc, "2026-10-17", "trk_household", "opt_household_3");
    doc = toggleHabit(doc, "2026-10-17", "trk_household", "opt_household_1");
    doc = toggleHabit(doc, "2026-10-02", "trk_household", "opt_household_2");
    doc = toggleHabit(doc, "2026-11-01", "trk_household", "opt_household_1");
    const items = monthBoardItems(doc, "trk_household", 2026, 10);
    expect(items.map((item) => [item.dateKey, item.optionId, item.shape])).toEqual([
      ["2026-10-02", "opt_household_2", "domino"],
      ["2026-10-17", "opt_household_1", "single"],
      ["2026-10-17", "opt_household_3", "i"],
    ]);
    expect(new Set(items.map((item) => item.key)).size).toBe(3);
  });

  it("is empty for other kinds of trackers and unknown ids", () => {
    const doc = documentWith("weather");
    expect(monthBoardItems(doc, "trk_weather", 2026, 10)).toEqual([]);
    expect(monthBoardItems(doc, "trk_nope", 2026, 10)).toEqual([]);
  });

  it("turns a habit of a deleted option into a single square", () => {
    let doc = documentWith("household");
    doc = toggleHabit(doc, "2026-10-17", "trk_household", "opt_household_3");
    const tracker = doc.trackers[0];
    if (!tracker) {
      throw new Error("tracker missing");
    }
    const without = {
      ...doc,
      trackers: [
        { ...tracker, options: tracker.options.filter((o) => o.id !== "opt_household_3") },
      ],
    };
    expect(monthBoardItems(without, "trk_household", 2026, 10)).toMatchObject([
      { optionId: "opt_household_3", shape: "single" },
    ]);
  });
});

describe("blockEdges", () => {
  it("draws the perimeter of every shape, and no inner lines", () => {
    const perimeter: Record<ShapeId, number> = {
      single: 4,
      domino: 6,
      i: 10,
      o: 8,
      s: 10,
      z: 10,
      t: 10,
      l: 10,
      j: 10,
    };
    for (const shape of SHAPE_IDS) {
      for (const cells of orientations(shape)) {
        expect(blockEdges(cells)).toHaveLength(perimeter[shape]);
      }
    }
  });

  it("is unit edges on grid lines, with no edge twice", () => {
    const edges = blockEdges(SHAPE_CELLS.t);
    const keys = edges.map(
      (e) => `${String(e.x1)},${String(e.y1)}-${String(e.x2)},${String(e.y2)}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
    for (const edge of edges) {
      expect(Math.abs(edge.x2 - edge.x1) + Math.abs(edge.y2 - edge.y1)).toBe(1);
    }
  });

  it("is empty for no cells", () => {
    expect(blockEdges([])).toEqual([]);
  });
});

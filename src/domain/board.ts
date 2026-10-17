import { monthDateKeys } from "./calendar";
import type { AppDocument, ShapeId } from "./types";

// The habit board: every habit done on a day becomes a block that "falls" onto the board, like
// Tetris. The layout is derived from the marks and never stored. It is a pure function: the same
// items in the same order always give the same board, and edits to a past day simply re-run it.

export interface Cell {
  readonly x: number;
  /** 0 is the bottom row, rows grow upward. */
  readonly y: number;
}

/** Cells of each shape in its base orientation, x to the right and y up, starting at 0. */
export const SHAPE_CELLS: Readonly<Record<ShapeId, readonly Cell[]>> = {
  single: [{ x: 0, y: 0 }],
  domino: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ],
  i: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 0 },
  ],
  o: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
  s: [
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
  z: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  t: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 1, y: 1 },
  ],
  l: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 1 },
  ],
  j: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 1 },
  ],
};

export const DEFAULT_BOARD_WIDTH = 10;

function normalize(cells: readonly Cell[]): Cell[] {
  const minX = Math.min(...cells.map((cell) => cell.x));
  const minY = Math.min(...cells.map((cell) => cell.y));
  return cells
    .map((cell) => ({ x: cell.x - minX, y: cell.y - minY }))
    .toSorted((a, b) => a.y - b.y || a.x - b.x);
}

function rotate(cells: readonly Cell[]): Cell[] {
  return normalize(cells.map((cell) => ({ x: cell.y, y: -cell.x })));
}

const signature = (cells: readonly Cell[]): string =>
  cells.map((cell) => `${String(cell.x)},${String(cell.y)}`).join(" ");

/** The distinct orientations of a shape, in a fixed order. */
export function orientations(shape: ShapeId): Cell[][] {
  const result: Cell[][] = [];
  const seen = new Set<string>();
  let current = normalize(SHAPE_CELLS[shape]);
  for (let turn = 0; turn < 4; turn += 1) {
    const key = signature(current);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(current);
    }
    current = rotate(current);
  }
  return result;
}

/** A small stable hash, only used to break ties so the board does not pile up on one side. */
function hash(text: string): number {
  let value = 5381;
  for (const character of text) {
    value = (Math.imul(value, 33) + (character.codePointAt(0) ?? 0)) % 1_000_003;
  }
  return value;
}

export interface BoardItem {
  /** Unique and stable, for example date plus option id. Also feeds the tie-break. */
  readonly key: string;
  readonly shape: ShapeId;
}

export interface PlacedBlock<Item extends BoardItem> {
  readonly item: Item;
  readonly cells: readonly Cell[];
}

export interface BoardLayout<Item extends BoardItem> {
  readonly width: number;
  /** Rows used, so the height of the tallest column. */
  readonly height: number;
  readonly blocks: readonly PlacedBlock<Item>[];
}

/** Lexicographic comparison of two scores of the same length. */
function isLess(a: readonly number[], b: readonly number[]): boolean {
  for (const [index, part] of a.entries()) {
    const other = b[index] ?? 0;
    if (part !== other) {
      return part < other;
    }
  }
  return false;
}

const cellKey = (x: number, y: number): string => `${String(x)},${String(y)}`;

/**
 * Drops the items one after another onto a board of the given width, in the order given. Each
 * block picks the orientation and column that leave the fewest holes, then the lowest stack,
 * and a stable hash decides between equals. Blocks fall straight down until they rest.
 */
export function layoutBoard<Item extends BoardItem>(
  items: readonly Item[],
  width: number = DEFAULT_BOARD_WIDTH,
): BoardLayout<Item> {
  const occupied = new Set<string>();
  let height = 0;
  const blocks: PlacedBlock<Item>[] = [];

  for (const item of items) {
    let best: { cells: Cell[]; score: readonly [number, number, number, number] } | undefined;
    for (const [turn, shape] of orientations(item.shape).entries()) {
      const blockWidth = Math.max(...shape.map((cell) => cell.x)) + 1;
      const blockHeight = Math.max(...shape.map((cell) => cell.y)) + 1;
      if (blockWidth > width) {
        continue;
      }
      for (let left = 0; left + blockWidth <= width; left += 1) {
        const fits = (y: number) =>
          shape.every(
            (cell) => y + cell.y >= 0 && !occupied.has(cellKey(left + cell.x, y + cell.y)),
          );
        let bottom = height;
        while (bottom > 0 && fits(bottom - 1)) {
          bottom -= 1;
        }
        let holes = 0;
        for (let column = 0; column < blockWidth; column += 1) {
          const lowest = Math.min(
            ...shape.filter((cell) => cell.x === column).map((cell) => cell.y),
          );
          for (
            let y = bottom + lowest - 1;
            y >= 0 && !occupied.has(cellKey(left + column, y));
            y -= 1
          ) {
            holes += 1;
          }
        }
        const score = [
          holes,
          bottom + blockHeight,
          bottom,
          hash(`${item.key}|${String(turn)}|${String(left)}`),
        ] as const;
        const better = best === undefined || isLess(score, best.score);
        if (better) {
          best = {
            cells: shape.map((cell) => ({ x: left + cell.x, y: bottom + cell.y })),
            score,
          };
        }
      }
    }
    if (!best) {
      continue;
    }
    for (const cell of best.cells) {
      occupied.add(cellKey(cell.x, cell.y));
      height = Math.max(height, cell.y + 1);
    }
    blocks.push({ item, cells: best.cells });
  }
  return { width, height, blocks };
}

/** A habit done on a day, ready to be dropped on the board. */
export interface HabitBoardItem extends BoardItem {
  readonly dateKey: string;
  readonly optionId: string;
}

/**
 * The habits done in one month, oldest day first and within a day in the order of the legend.
 * A habit without a shape, or whose option was deleted, becomes a single square.
 */
export function monthBoardItems(
  doc: AppDocument,
  trackerId: string,
  year: number,
  month: number,
): HabitBoardItem[] {
  const tracker = doc.trackers.find((candidate) => candidate.id === trackerId);
  if (tracker?.kind !== "habits") {
    return [];
  }
  const items: HabitBoardItem[] = [];
  for (const dateKey of monthDateKeys(year, month)) {
    const picked = doc.days[dateKey]?.marks[trackerId] ?? [];
    const known = tracker.options.filter((option) => picked.includes(option.id));
    for (const option of known) {
      items.push({
        key: `${dateKey}|${option.id}`,
        dateKey,
        optionId: option.id,
        shape: option.shape === "" ? "single" : option.shape,
      });
    }
    const knownIds = new Set(tracker.options.map((option) => option.id));
    for (const optionId of picked.filter((id) => !knownIds.has(id))) {
      items.push({ key: `${dateKey}|${optionId}`, dateKey, optionId, shape: "single" });
    }
  }
  return items;
}

export interface Edge {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

/**
 * The outline of a block as unit edges on the grid lines (y up): every cell side that has no
 * neighbor of the same block. Drawing them thick makes blocks of the same color tell apart.
 */
export function blockEdges(cells: readonly Cell[]): Edge[] {
  const own = new Set(cells.map((cell) => cellKey(cell.x, cell.y)));
  const edges: Edge[] = [];
  for (const { x, y } of cells) {
    if (!own.has(cellKey(x, y - 1))) {
      edges.push({ x1: x, y1: y, x2: x + 1, y2: y });
    }
    if (!own.has(cellKey(x, y + 1))) {
      edges.push({ x1: x, y1: y + 1, x2: x + 1, y2: y + 1 });
    }
    if (!own.has(cellKey(x - 1, y))) {
      edges.push({ x1: x, y1: y, x2: x, y2: y + 1 });
    }
    if (!own.has(cellKey(x + 1, y))) {
      edges.push({ x1: x + 1, y1: y, x2: x + 1, y2: y + 1 });
    }
  }
  return edges;
}

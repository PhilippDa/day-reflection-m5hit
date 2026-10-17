import { SHAPE_CELLS } from "../../../domain/board";
import type { ShapeId } from "../../../domain/types";
import styles from "./ShapeIcon.module.css";

export interface ShapeIconProps {
  readonly shape: ShapeId;
  /** `#rrggbb`, taken from the data. */
  readonly color: string;
}

/** A small picture of a block shape in its color. Decoration only. */
export function ShapeIcon({ shape, color }: ShapeIconProps) {
  const cells = SHAPE_CELLS[shape];
  const width = Math.max(...cells.map((cell) => cell.x)) + 1;
  const height = Math.max(...cells.map((cell) => cell.y)) + 1;
  return (
    <svg
      class={styles["icon"] ?? ""}
      style={{ "--shape": color, "--w": width, "--h": height }}
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      aria-hidden="true"
    >
      {cells.map((cell) => (
        <rect
          key={`${String(cell.x)},${String(cell.y)}`}
          x={cell.x}
          y={height - 1 - cell.y}
          width="1"
          height="1"
        />
      ))}
    </svg>
  );
}

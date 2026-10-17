import { blockEdges, type BoardLayout, type HabitBoardItem } from "../../../domain/board";
import { introVars, useIntro } from "../../intro";
import intro from "../../intro.module.css";
import styles from "./HabitBoard.module.css";

export interface HabitBoardProps {
  readonly layout: BoardLayout<HabitBoardItem>;
  /** The color of a block, from its option. */
  readonly colorOf: (item: HabitBoardItem) => string;
  /** Names the board for screen readers, for example "Haushalt-Board Oktober 2026: 12 Blöcke". */
  readonly label: string;
}

/** Rows shown at least, so an empty month still looks like a playing field. */
const MIN_ROWS = 6;

/**
 * The habit board as a picture. Blocks stack from the bottom. The picture is described by `label`
 * and the day list next to it carries the details, so the SVG itself is a single image.
 */
export function HabitBoard({ layout, colorOf, label }: HabitBoardProps) {
  const rows = Math.max(layout.height, MIN_ROWS);
  const playing = useIntro(layout.blocks.length);
  return (
    <svg
      class={styles["board"] ?? ""}
      style={introVars(layout.blocks.length)}
      viewBox={`0 0 ${String(layout.width)} ${String(rows)}`}
    >
      <title>{label}</title>
      <rect class={styles["field"] ?? ""} width={layout.width} height={rows} />
      {layout.blocks.map((block, index) => (
        <g
          key={block.item.key}
          class={`${styles["block"] ?? ""} ${playing ? (intro["drop"] ?? "") : ""}`}
          style={{ "--block": colorOf(block.item), "--i": index }}
        >
          {block.cells.map((cell) => (
            <rect
              key={`${String(cell.x)},${String(cell.y)}`}
              x={cell.x}
              y={rows - 1 - cell.y}
              width="1"
              height="1"
            />
          ))}
          <path
            class={styles["outline"] ?? ""}
            d={blockEdges(block.cells)
              .map(
                (edge) =>
                  `M ${String(edge.x1)} ${String(rows - edge.y1)} L ${String(edge.x2)} ${String(rows - edge.y2)}`,
              )
              .join(" ")}
          />
        </g>
      ))}
    </svg>
  );
}

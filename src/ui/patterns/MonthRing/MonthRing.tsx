import type { TrackerCell } from "../../../domain/cells";
import { readableInk } from "../../../domain/color";
import { ringSegments } from "../../../domain/ring";
import styles from "./MonthRing.module.css";

export interface MonthRingProps {
  /** The days of one month in order, see `monthCells`. */
  readonly cells: readonly TrackerCell[];
  /** Big text in the middle, for example the month name. */
  readonly title: string;
  /** Small text under it, for example the year. */
  readonly subtitle: string;
  /** Names the ring for screen readers. */
  readonly label: string;
  /** Accessible name of one day. */
  readonly cellLabel: (cell: TrackerCell) => string;
  readonly onSelect: (dateKey: string) => void;
}

const SIZE = 360;
const RING = {
  centerX: SIZE / 2,
  centerY: SIZE / 2,
  innerRadius: 92,
  outerRadius: 172,
  gapDegrees: 2,
};

/** A month as a ring of day segments, day 1 at the top. Every segment is a keyboard-reachable button. */
export function MonthRing({ cells, title, subtitle, label, cellLabel, onSelect }: MonthRingProps) {
  const segments = ringSegments(cells.length, RING);
  return (
    <section class={styles["wrapper"] ?? ""} aria-label={label}>
      <svg class={styles["ring"] ?? ""} viewBox={`0 0 ${String(SIZE)} ${String(SIZE)}`}>
        {segments.map((segment) => {
          const cell = cells[segment.index];
          if (!cell || cell.dateKey === null) {
            return null;
          }
          const { dateKey } = cell;
          const color = cell.option?.color;
          const select = () => {
            onSelect(dateKey);
          };
          return (
            <g
              key={dateKey}
              class={`${styles["segment"] ?? ""} ${styles[cell.status] ?? ""}`}
              style={color ? { "--cell": color, "--on-cell": readableInk(color) } : undefined}
              // SVG shapes have no native button element, so the role is needed here.
              // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
              role="button"
              tabindex={0}
              aria-label={cellLabel(cell)}
              onClick={select}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  select();
                }
              }}
            >
              <path d={segment.path} class={styles["shape"] ?? ""} />
              <text x={segment.labelX} y={segment.labelY} class={styles["day"] ?? ""}>
                {cell.day}
              </text>
            </g>
          );
        })}
        <text x={SIZE / 2} y={SIZE / 2 - 4} class={styles["title"] ?? ""}>
          {title}
        </text>
        <text x={SIZE / 2} y={SIZE / 2 + 26} class={styles["subtitle"] ?? ""}>
          {subtitle}
        </text>
      </svg>
    </section>
  );
}

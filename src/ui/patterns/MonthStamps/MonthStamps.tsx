import type { TrackerCell } from "../../../domain/cells";
import { introVars, useIntro } from "../../intro";
import intro from "../../intro.module.css";
import styles from "./MonthStamps.module.css";

export interface MonthStampsProps {
  /** The days of one month in order, see `monthCells`. */
  readonly cells: readonly TrackerCell[];
  /** How many empty cells come before the 1st, with Monday first (0 to 6). */
  readonly offset: number;
  /** Seven short weekday names, Monday first. */
  readonly weekdays: readonly string[];
  readonly label: string;
  readonly cellLabel: (cell: TrackerCell) => string;
  readonly onSelect: (dateKey: string) => void;
}

/** A paw print: four toes and a pad. */
function Paw({ animated, index }: { readonly animated: boolean; readonly index: number }) {
  return (
    <svg
      class={`${styles["paw"] ?? ""} ${animated ? (intro["pop"] ?? "") : ""}`}
      style={{ "--i": index }}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <ellipse cx="12" cy="16.5" rx="5.8" ry="4.6" />
      <circle cx="4.8" cy="10.5" r="2.3" />
      <circle cx="9.2" cy="5.8" r="2.5" />
      <circle cx="14.8" cy="5.8" r="2.5" />
      <circle cx="19.2" cy="10.5" r="2.3" />
    </svg>
  );
}

/** A month as a calendar where every day is stamped with a paw print in the option's color. */
export function MonthStamps({
  cells,
  offset,
  weekdays,
  label,
  cellLabel,
  onSelect,
}: MonthStampsProps) {
  const filled = cells.filter((cell) => cell.status !== "empty" && cell.dateKey !== null);
  const playing = useIntro(filled.length);
  return (
    <section class={styles["stamps"] ?? ""} style={introVars(filled.length)} aria-label={label}>
      {weekdays.map((weekday) => (
        <span key={weekday} class={styles["weekday"] ?? ""} aria-hidden="true">
          {weekday}
        </span>
      ))}
      {Array.from({ length: offset }, (_unused, index) => (
        <span key={`blank-${String(index)}`} />
      ))}
      {cells.map((cell) =>
        cell.dateKey === null ? null : (
          <button
            key={cell.dateKey}
            type="button"
            class={`${styles["cell"] ?? ""} ${styles[cell.status] ?? ""}`}
            style={cell.option ? { "--cell": cell.option.color } : undefined}
            aria-label={cellLabel(cell)}
            onClick={() => {
              if (cell.dateKey !== null) {
                onSelect(cell.dateKey);
              }
            }}
          >
            <Paw animated={playing && cell.status !== "empty"} index={filled.indexOf(cell)} />
            <span class={styles["day"] ?? ""} aria-hidden="true">
              {cell.day}
            </span>
          </button>
        ),
      )}
    </section>
  );
}

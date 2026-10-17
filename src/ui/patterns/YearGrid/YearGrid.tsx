import type { TrackerCell } from "../../../domain/cells";
import styles from "./YearGrid.module.css";

export interface YearGridProps {
  /** 31 rows (days) by 12 columns (months), see `yearCells`. */
  readonly cells: readonly (readonly TrackerCell[])[];
  readonly variant: "squares" | "dots";
  /** One letter per month, for the column headings. */
  readonly monthLabels: readonly string[];
  /** Names the grid for screen readers. */
  readonly label: string;
  /** Accessible name of one cell, for example "17. Oktober: Sonnig". */
  readonly cellLabel: (cell: TrackerCell) => string;
  readonly onSelect: (dateKey: string) => void;
}

/**
 * A year at a glance. Cells are small on purpose: the grid is for looking and for tap-to-open.
 * Days that do not exist (Feb 30) are dark and not focusable.
 */
export function YearGrid({
  cells,
  variant,
  monthLabels,
  label,
  cellLabel,
  onSelect,
}: YearGridProps) {
  return (
    <section class={`${styles["grid"] ?? ""} ${styles[variant] ?? ""}`} aria-label={label}>
      <span />
      {monthLabels.map((month, index) => (
        <span key={index} class={styles["month"] ?? ""} aria-hidden="true">
          {month}
        </span>
      ))}
      {cells.map((row, index) => (
        <div key={index} class={styles["row"] ?? ""}>
          <span class={styles["day"] ?? ""} aria-hidden="true">
            {index + 1}
          </span>
          {row.map((cell) =>
            cell.dateKey === null ? (
              <span key={cell.month} class={`${styles["cell"] ?? ""} ${styles["invalid"] ?? ""}`} />
            ) : (
              <button
                key={cell.month}
                type="button"
                class={`${styles["cell"] ?? ""} ${styles[cell.status] ?? ""}`}
                style={cell.option ? { "--cell": cell.option.color } : undefined}
                aria-label={cellLabel(cell)}
                onClick={() => {
                  if (cell.dateKey !== null) {
                    onSelect(cell.dateKey);
                  }
                }}
              />
            ),
          )}
        </div>
      ))}
    </section>
  );
}

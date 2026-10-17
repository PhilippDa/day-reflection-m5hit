import type { TrackerCell } from "../../../domain/cells";
import styles from "./TrackerPreview.module.css";

export interface TrackerPreviewProps {
  /** The last days, oldest first. */
  readonly cells: readonly TrackerCell[];
}

/** A row of tiny colored squares, one per recent day. Decoration only. */
export function TrackerPreview({ cells }: TrackerPreviewProps) {
  return (
    <span class={styles["preview"] ?? ""} aria-hidden="true">
      {cells.map((cell) => (
        <span
          key={cell.dateKey}
          class={`${styles["cell"] ?? ""} ${styles[cell.status] ?? ""}`}
          style={cell.option ? { "--cell": cell.option.color } : undefined}
        />
      ))}
    </span>
  );
}

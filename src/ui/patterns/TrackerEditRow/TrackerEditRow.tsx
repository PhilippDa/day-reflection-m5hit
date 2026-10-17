import styles from "./TrackerEditRow.module.css";

export interface TrackerEditRowProps {
  readonly title: string;
  readonly icon: string;
  /** Accessible names, since the visible arrows alone say nothing. */
  readonly editLabel: string;
  readonly upLabel: string;
  readonly downLabel: string;
  readonly canMoveUp: boolean;
  readonly canMoveDown: boolean;
  readonly onEdit: () => void;
  readonly onMove: (delta: number) => void;
}

/** One tracker in the settings list: open it, or move it up and down. */
export function TrackerEditRow({
  title,
  icon,
  editLabel,
  upLabel,
  downLabel,
  canMoveUp,
  canMoveDown,
  onEdit,
  onMove,
}: TrackerEditRowProps) {
  return (
    <div class={styles["row"] ?? ""}>
      <button type="button" class={styles["open"] ?? ""} aria-label={editLabel} onClick={onEdit}>
        <span aria-hidden="true">{icon}</span>
        <span class={styles["title"] ?? ""}>{title}</span>
      </button>
      <span class={styles["moves"] ?? ""}>
        <button
          type="button"
          class={styles["move"] ?? ""}
          aria-label={upLabel}
          disabled={!canMoveUp}
          onClick={() => {
            onMove(-1);
          }}
        >
          ↑
        </button>
        <button
          type="button"
          class={styles["move"] ?? ""}
          aria-label={downLabel}
          disabled={!canMoveDown}
          onClick={() => {
            onMove(1);
          }}
        >
          ↓
        </button>
      </span>
    </div>
  );
}

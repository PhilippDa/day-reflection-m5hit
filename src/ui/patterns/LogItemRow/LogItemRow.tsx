import styles from "./LogItemRow.module.css";

export interface LogItemRowProps {
  readonly title: string;
  /** Already formatted, for example "17. Oktober 2026". */
  readonly date: string;
  readonly rating: number;
  readonly note: string;
  /** Accessible name of the row button, with title and rating, for example "Bearbeiten: Wicked, 4 von 5 Sternen". */
  readonly editLabel: string;
  readonly onEdit: () => void;
}

/** One entry of a list tracker: title, date, stars and a short note. Tap to edit. */
export function LogItemRow({ title, date, rating, note, editLabel, onEdit }: LogItemRowProps) {
  return (
    <button type="button" class={styles["row"] ?? ""} aria-label={editLabel} onClick={onEdit}>
      <span class={styles["title"] ?? ""}>{title}</span>
      <span class={styles["meta"] ?? ""}>
        {date}
        {rating === 0 ? "" : ` · ${"★".repeat(rating)}${"☆".repeat(5 - rating)}`}
      </span>
      {note === "" ? null : <span class={styles["note"] ?? ""}>{note}</span>}
    </button>
  );
}

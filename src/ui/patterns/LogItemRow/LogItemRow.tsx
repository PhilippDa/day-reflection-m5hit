import styles from "./LogItemRow.module.css";
import { Icon } from "../../icons";

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

/**
 * One entry of a list tracker: title, date, stars and a short note. Tap to edit. Without a title
 * (a notes entry) the date leads and the text is cut off after a few lines.
 */
export function LogItemRow({ title, date, rating, note, editLabel, onEdit }: LogItemRowProps) {
  return (
    <button type="button" class={styles["row"] ?? ""} aria-label={editLabel} onClick={onEdit}>
      {title === "" ? null : <span class={styles["title"] ?? ""}>{title}</span>}
      <span class={styles["meta"] ?? ""}>
        {date}
        {rating === 0 ? null : (
          <>
            {" · "}
            {[1, 2, 3, 4, 5].map((star) => (
              <Icon key={star} name={star <= rating ? "star_fill" : "star"} />
            ))}
          </>
        )}
      </span>
      {note === "" ? null : (
        <span class={`${styles["note"] ?? ""} ${title === "" ? (styles["clamped"] ?? "") : ""}`}>
          {note}
        </span>
      )}
    </button>
  );
}

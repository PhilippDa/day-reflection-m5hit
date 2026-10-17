import { useState } from "preact/hooks";
import { isTextTracker } from "../../../domain/logs";
import type { LogItem, Tracker } from "../../../domain/types";
import { de } from "../../../i18n/de";
import { formatDateLong } from "../../../i18n/format";
import { LogItemRow } from "../../patterns/LogItemRow";
import { Button } from "../../primitives/Button";
import { LogEditor } from "./LogEditor";
import styles from "./LogItems.module.css";

export interface LogItemsProps {
  readonly tracker: Tracker;
  readonly items: readonly LogItem[];
  /** Date preselected for a new item. */
  readonly defaultDate: string;
}

function ratingText(rating: number): string {
  return rating === 0 ? de.log.unrated : de.log.rating(rating);
}

/** The entries of one list tracker plus the button and sheet to add or edit them. */
export function LogItems({ tracker, items, defaultDate }: LogItemsProps) {
  // "new" opens an empty form, an item opens it for editing, null keeps the sheet closed.
  const [editing, setEditing] = useState<LogItem | "new" | null>(null);
  const text = isTextTracker(tracker);
  return (
    <div class={styles["items"] ?? ""}>
      {items.length === 0 ? <p class={styles["empty"] ?? ""}>{de.log.empty}</p> : null}
      {items.map((item) => (
        <LogItemRow
          key={item.id}
          title={item.title}
          date={formatDateLong(item.date)}
          rating={item.rating}
          note={item.note}
          editLabel={
            text
              ? de.log.editNote(formatDateLong(item.date))
              : `${de.log.edit(item.title)}, ${ratingText(item.rating)}`
          }
          onEdit={() => {
            setEditing(item);
          }}
        />
      ))}
      <Button
        variant="secondary"
        onClick={() => {
          setEditing("new");
        }}
      >
        {de.log.add}
      </Button>
      {editing === null ? null : (
        <LogEditor
          key={editing === "new" ? "new" : editing.id}
          tracker={tracker}
          item={editing === "new" ? null : editing}
          defaultDate={defaultDate}
          onClose={() => {
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

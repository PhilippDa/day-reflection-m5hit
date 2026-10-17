import { useState } from "preact/hooks";
import { isDateKey } from "../../../domain/dates";
import { isTextTracker } from "../../../domain/logs";
import type { LogItem, Tracker } from "../../../domain/types";
import { de } from "../../../i18n/de";
import { LogItemForm, type LogItemValues } from "../../patterns/LogItemForm";
import { BottomSheet } from "../../primitives/BottomSheet";
import { useStore } from "../../StoreContext";

export interface LogEditorProps {
  readonly tracker: Tracker;
  /** The item to edit, or `null` for a new one. */
  readonly item: LogItem | null;
  /** Date preselected for a new item. */
  readonly defaultDate: string;
  readonly onClose: () => void;
}

/** A bottom sheet to add or edit one entry of a list tracker. */
export function LogEditor({ tracker, item, defaultDate, onClose }: LogEditorProps) {
  const store = useStore();
  const [values, setValues] = useState<LogItemValues>({
    title: item?.title ?? "",
    date: item?.date ?? defaultDate,
    rating: item?.rating ?? 0,
    note: item?.note ?? "",
  });
  const text = isTextTracker(tracker);
  const canSave =
    (text ? values.note.trim() : values.title.trim()) !== "" && isDateKey(values.date);

  function save() {
    if (item) {
      store.updateLogItem(item.id, values);
    } else {
      store.addLogItem(tracker.id, values);
    }
    onClose();
  }

  return (
    <BottomSheet
      title={item ? de.log.editTitle : de.log.newTitle}
      closeLabel={de.log.cancel}
      onClose={onClose}
    >
      <LogItemForm
        values={values}
        maxDate={store.todayKey.value}
        entries={text ? "text" : "titled"}
        canSave={canSave}
        onChange={(patch) => {
          setValues((current) => ({ ...current, ...patch }));
        }}
        onSave={save}
        {...(item
          ? {
              onDelete: () => {
                store.deleteLogItem(item.id);
                onClose();
              },
            }
          : {})}
      />
    </BottomSheet>
  );
}

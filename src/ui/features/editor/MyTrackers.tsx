import { de } from "../../../i18n/de";
import { TrackerEditRow } from "../../patterns/TrackerEditRow";
import { useStore } from "../../StoreContext";
import styles from "./Editor.module.css";

export interface MyTrackersProps {
  readonly onEdit: (trackerId: string) => void;
}

/** All trackers in order, to open or reorder. */
export function MyTrackers({ onEdit }: MyTrackersProps) {
  const store = useStore();
  const trackers = store.trackers.value;
  if (trackers.length === 0) {
    return <p class={styles["hint"] ?? ""}>{de.myTrackers.empty}</p>;
  }
  return (
    <ul class={styles["list"] ?? ""}>
      {trackers.map((tracker, index) => (
        <li key={tracker.id}>
          <TrackerEditRow
            title={tracker.title}
            icon={tracker.icon}
            editLabel={de.myTrackers.edit(tracker.title)}
            upLabel={de.myTrackers.up(tracker.title)}
            downLabel={de.myTrackers.down(tracker.title)}
            canMoveUp={index > 0}
            canMoveDown={index < trackers.length - 1}
            onEdit={() => {
              onEdit(tracker.id);
            }}
            onMove={(delta) => {
              store.moveTracker(tracker.id, delta);
            }}
          />
        </li>
      ))}
    </ul>
  );
}

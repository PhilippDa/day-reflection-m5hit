import { de } from "../../../i18n/de";
import { DayHeader } from "../../patterns/DayHeader";
import { TrackerListItem } from "../../patterns/TrackerListItem";
import { TrackerPreview } from "../../patterns/TrackerPreview";
import { useStore } from "../../StoreContext";
import { TrackerDetailView } from "./TrackerDetailView";
import styles from "./TrackersView.module.css";

/** The overview of all trackers, or the detail screen of the opened one. */
export function TrackersView() {
  const store = useStore();
  const opened = store.openedTracker.value;
  if (opened) {
    return <TrackerDetailView tracker={opened} />;
  }
  const trackers = store.trackers.value;
  const previews = store.previews.value;
  const yearDays = store.yearDays.value;
  return (
    <main class={styles["page"] ?? ""}>
      <DayHeader title={de.trackers.title} />
      {trackers.length === 0 ? <p>{de.trackers.empty}</p> : null}
      <ul class={styles["list"] ?? ""}>
        {trackers.map((tracker) => {
          const preview = previews[tracker.id];
          return (
            <li key={tracker.id}>
              <TrackerListItem
                title={tracker.title}
                icon={tracker.icon}
                detail={
                  tracker.kind === "log"
                    ? de.log.itemCount(yearDays[tracker.id] ?? 0)
                    : de.trackers.markedDays(yearDays[tracker.id] ?? 0)
                }
                onOpen={() => {
                  store.openTracker(tracker.id);
                }}
              >
                {preview ? <TrackerPreview cells={preview} /> : null}
              </TrackerListItem>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

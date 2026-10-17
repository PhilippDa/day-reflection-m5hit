import { de } from "../../../i18n/de";
import { formatDateLong } from "../../../i18n/format";
import { DayNavigator } from "../../patterns/DayNavigator";
import { OptionChips } from "../../patterns/OptionChips";
import { TrackerCard } from "../../patterns/TrackerCard";
import { Notice } from "../../primitives/Notice";
import { useStore } from "../../StoreContext";
import { LogItems } from "../log";
import { PresetGallery } from "../presets";
import styles from "./TodayView.module.css";

export function TodayView() {
  const store = useStore();
  const isToday = store.isToday.value;
  const date = formatDateLong(store.selectedDate.value);
  const day = store.day.value;
  const progress = store.progress.value;
  const progressText =
    progress.total === 0 ? "" : de.today.progress(progress.filled, progress.total);

  if (store.trackers.value.length === 0) {
    return (
      <main class={styles["page"] ?? ""}>
        <h1>{de.gallery.heading}</h1>
        <p>{de.gallery.intro}</p>
        <PresetGallery />
      </main>
    );
  }

  return (
    <main class={styles["page"] ?? ""}>
      <DayNavigator
        title={isToday ? de.today.title : date}
        subtitle={isToday ? date : progressText}
        isToday={isToday}
        canGoNext={store.canGoNext.value}
        onPrevious={store.previousDay}
        onNext={store.nextDay}
        onToday={store.goToToday}
      />
      {isToday && progressText !== "" ? (
        <p class={styles["progress"] ?? ""}>{progressText}</p>
      ) : null}

      {store.saveFailed.value ? <Notice tone="error">{de.errors.saveFailed}</Notice> : null}

      {store.daily.value.map((tracker) => {
        const picked = day.marks[tracker.id] ?? [];
        const toggle = tracker.kind === "habits" ? store.toggleHabit : store.toggleChoice;
        return (
          <TrackerCard
            key={tracker.id}
            title={tracker.title}
            icon={tracker.icon}
            badge={picked.length === 0 ? de.today.open : ""}
          >
            <OptionChips
              options={tracker.options}
              picked={picked}
              onToggle={(optionId) => {
                toggle(tracker.id, optionId);
              }}
            />
          </TrackerCard>
        );
      })}

      {store.logTrackers.value.map((tracker) => (
        <TrackerCard key={tracker.id} title={tracker.title} icon={tracker.icon}>
          <LogItems
            tracker={tracker}
            items={store.dayLogItems.value[tracker.id] ?? []}
            defaultDate={store.selectedDate.value}
          />
        </TrackerCard>
      ))}
    </main>
  );
}

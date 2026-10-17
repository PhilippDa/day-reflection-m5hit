import type { Tracker } from "../../../domain/types";
import { de } from "../../../i18n/de";
import { formatDateLong } from "../../../i18n/format";
import { OptionChips } from "../../patterns/OptionChips";
import { BottomSheet } from "../../primitives/BottomSheet";
import { useStore } from "../../StoreContext";

/** Edits one past day of the opened tracker. Renders nothing while no day is chosen. */
export function DaySheet({ tracker }: { readonly tracker: Tracker }) {
  const store = useStore();
  const dateKey = store.sheetDate.value;
  if (dateKey === null) {
    return null;
  }
  const toggle = tracker.kind === "habits" ? store.toggleHabit : store.toggleChoice;
  return (
    <BottomSheet
      title={formatDateLong(dateKey)}
      closeLabel={de.trackers.sheetClose}
      onClose={store.closeDay}
    >
      <OptionChips
        options={tracker.options}
        picked={store.sheetPicks.value}
        onToggle={(optionId) => {
          toggle(tracker.id, optionId, dateKey);
        }}
      />
    </BottomSheet>
  );
}

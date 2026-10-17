import { useId } from "preact/hooks";
import { weekdayOffset } from "../../../domain/calendar";
import type { TrackerCell } from "../../../domain/cells";
import type { Tracker } from "../../../domain/types";
import { de } from "../../../i18n/de";
import {
  formatDayMonth,
  formatMonthName,
  formatMonthYear,
  MONTH_INITIALS,
  WEEKDAY_SHORT,
} from "../../../i18n/format";
import { DayStrip } from "../../patterns/DayStrip";
import { HabitBoard } from "../../patterns/HabitBoard";
import { Legend } from "../../patterns/Legend";
import { MonthRing } from "../../patterns/MonthRing";
import { MonthStamps } from "../../patterns/MonthStamps";
import { YearGrid } from "../../patterns/YearGrid";
import { Button } from "../../primitives/Button";
import { Notice } from "../../primitives/Notice";
import { useStore } from "../../StoreContext";
import { LogItems } from "../log";
import { DaySheet } from "./DaySheet";
import styles from "./TrackersView.module.css";

const UNKNOWN_COLOR = "#9a9a9a";

function cellLabel(cell: TrackerCell): string {
  const date = cell.dateKey === null ? "" : formatDayMonth(cell.dateKey);
  if (cell.status === "marked" && cell.option) {
    return de.trackers.cellMarked(date, cell.option.label);
  }
  return cell.status === "unknown" ? de.trackers.cellUnknown(date) : de.trackers.cellEmpty(date);
}

interface NavProps {
  readonly label: string;
  readonly previousLabel: string;
  readonly nextLabel: string;
  readonly canGoNext: boolean;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
}

function PeriodNav({ label, previousLabel, nextLabel, canGoNext, onPrevious, onNext }: NavProps) {
  return (
    <div class={styles["yearNav"] ?? ""}>
      <Button variant="secondary" onClick={onPrevious}>
        {`‹ ${previousLabel}`}
      </Button>
      <strong class={styles["year"] ?? ""}>{label}</strong>
      <Button variant="secondary" disabled={!canGoNext} onClick={onNext}>
        {`${nextLabel} ›`}
      </Button>
    </div>
  );
}

export function TrackerDetailView({ tracker }: { readonly tracker: Tracker }) {
  const store = useStore();
  const legendId = useId();
  const daysId = useId();
  const year = store.year.value;
  const { month, year: monthYear } = store.month.value;
  const isRing = tracker.view === "month-ring";
  const isStamps = tracker.view === "month-stamps";
  const isBoard = tracker.view === "board";
  const isMonthView = isRing || isStamps || isBoard;
  const counts = isMonthView ? store.monthCounts.value : store.yearCounts.value;
  const gridLabel = isMonthView
    ? de.trackers.gridLabel(tracker.title, formatMonthYear(monthYear, month))
    : de.trackers.gridLabel(tracker.title, String(year));

  return (
    <main class={styles["page"] ?? ""}>
      <Button variant="ghost" onClick={store.closeTracker}>
        {de.trackers.back}
      </Button>
      <h1 class={styles["detailTitle"] ?? ""}>
        <span aria-hidden="true">{tracker.icon}</span> {tracker.title}
      </h1>

      {tracker.kind === "log" ? null : isMonthView ? (
        <PeriodNav
          label={formatMonthYear(monthYear, month)}
          previousLabel={de.trackers.previousMonth}
          nextLabel={de.trackers.nextMonth}
          canGoNext={store.canGoNextMonth.value}
          onPrevious={store.previousMonth}
          onNext={store.nextMonth}
        />
      ) : (
        <PeriodNav
          label={String(year)}
          previousLabel={de.trackers.previousYear}
          nextLabel={de.trackers.nextYear}
          canGoNext={store.canGoNextYear.value}
          onPrevious={store.previousYear}
          onNext={store.nextYear}
        />
      )}

      {store.saveFailed.value ? <Notice tone="error">{de.errors.saveFailed}</Notice> : null}

      {isRing ? (
        <MonthRing
          cells={store.monthCells.value}
          title={formatMonthName(month)}
          subtitle={String(monthYear)}
          label={gridLabel}
          cellLabel={cellLabel}
          onSelect={store.openDay}
        />
      ) : null}
      {isStamps ? (
        <MonthStamps
          cells={store.monthCells.value}
          offset={weekdayOffset(monthYear, month)}
          weekdays={WEEKDAY_SHORT}
          label={gridLabel}
          cellLabel={cellLabel}
          onSelect={store.openDay}
        />
      ) : null}
      {tracker.view === "year-squares" || tracker.view === "year-dots" ? (
        <YearGrid
          cells={store.yearCells.value}
          variant={tracker.view === "year-dots" ? "dots" : "squares"}
          monthLabels={MONTH_INITIALS}
          label={gridLabel}
          cellLabel={cellLabel}
          onSelect={store.openDay}
        />
      ) : null}
      {tracker.view === "list" ? (
        <LogItems
          tracker={tracker}
          items={store.openedLogItems.value}
          defaultDate={store.todayKey.value}
        />
      ) : null}
      {isBoard ? (
        <>
          <HabitBoard
            layout={store.habitBoard.value}
            colorOf={(item) =>
              tracker.options.find((option) => option.id === item.optionId)?.color ?? UNKNOWN_COLOR
            }
            label={`${de.habits.boardLabel(tracker.title, formatMonthYear(monthYear, month))}: ${de.habits.blocks(store.habitBoard.value.blocks.length)}`}
          />
          <section class={styles["legend"] ?? ""} aria-labelledby={daysId}>
            <h2 id={daysId}>{de.habits.daysHeading}</h2>
            <DayStrip
              days={store.habitDays.value}
              label={gridLabel}
              dayLabel={(day) => de.habits.dayLabel(formatDayMonth(day.dateKey), day.count)}
              onSelect={store.openDay}
            />
          </section>
        </>
      ) : null}

      {tracker.kind === "log" ? null : (
        <section class={styles["legend"] ?? ""} aria-labelledby={legendId}>
          <h2 id={legendId}>{de.trackers.legendHeading}</h2>
          <Legend
            items={tracker.options.map((option) => ({
              id: option.id,
              label: option.label,
              color: option.color,
              icon: option.icon,
              shape: option.shape,
              count: counts.byOption[option.id] ?? 0,
            }))}
            unknownCount={counts.unknown}
            unknownLabel={de.trackers.unknownOption}
          />
        </section>
      )}

      <DaySheet tracker={tracker} />
    </main>
  );
}

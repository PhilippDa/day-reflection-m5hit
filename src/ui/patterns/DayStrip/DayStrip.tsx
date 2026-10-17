import styles from "./DayStrip.module.css";

export interface StripDay {
  readonly dateKey: string;
  readonly day: number;
  readonly count: number;
}

export interface DayStripProps {
  readonly days: readonly StripDay[];
  readonly label: string;
  /** Accessible name of one day, for example "17. Oktober: 3 Gewohnheiten". */
  readonly dayLabel: (day: StripDay) => string;
  readonly onSelect: (dateKey: string) => void;
}

/** The days of a month as buttons, each with how many things were done. Tap to edit that day. */
export function DayStrip({ days, label, dayLabel, onSelect }: DayStripProps) {
  return (
    <section class={styles["strip"] ?? ""} aria-label={label}>
      {days.map((day) => (
        <button
          key={day.dateKey}
          type="button"
          class={`${styles["day"] ?? ""} ${day.count > 0 ? (styles["done"] ?? "") : ""}`}
          aria-label={dayLabel(day)}
          onClick={() => {
            onSelect(day.dateKey);
          }}
        >
          <span aria-hidden="true">{day.day}</span>
          <span class={styles["count"] ?? ""} aria-hidden="true">
            {day.count > 0 ? day.count : ""}
          </span>
        </button>
      ))}
    </section>
  );
}

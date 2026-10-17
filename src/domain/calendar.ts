import { isDateKey } from "./dates";

/** Number of days in a month. `month` runs from 1 (January) to 12. */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** `YYYY-MM-DD` for a real calendar day, `null` for days that do not exist, such as Feb 30. */
export function toKey(year: number, month: number, day: number): string | null {
  const key = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return isDateKey(key) ? key : null;
}

export interface GridCell {
  readonly month: number;
  readonly day: number;
  /** `null` marks a day that does not exist in that month. */
  readonly dateKey: string | null;
}

/** The page layout of a year: 31 rows (days) by 12 columns (months). Missing days have no key. */
export function yearGrid(year: number): GridCell[][] {
  return Array.from({ length: 31 }, (_row, rowIndex) =>
    Array.from({ length: 12 }, (_column, columnIndex) => ({
      month: columnIndex + 1,
      day: rowIndex + 1,
      dateKey: toKey(year, columnIndex + 1, rowIndex + 1),
    })),
  );
}

/** Every date key of one month, in order. */
export function monthDateKeys(year: number, month: number): string[] {
  return Array.from({ length: daysInMonth(year, month) }, (_, index) => {
    const key = toKey(year, month, index + 1);
    return key ?? "";
  }).filter((key) => key !== "");
}

export interface YearMonth {
  readonly year: number;
  readonly month: number;
}

/** Moves forward or back by whole months, rolling over the year. */
export function shiftMonth(year: number, month: number, delta: number): YearMonth {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (((index % 12) + 12) % 12) + 1 };
}

/** How many empty cells come before the 1st in a calendar that starts on Monday (0 to 6). */
export function weekdayOffset(year: number, month: number): number {
  return (new Date(year, month - 1, 1).getDay() + 6) % 7;
}

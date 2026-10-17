import { parseDateKey } from "../domain/dates";
import { de } from "./de";

const longDate = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** "Samstag, 17. Oktober 2026" for a `YYYY-MM-DD` key. Falls back to the key itself. */
export function formatDateLong(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return date ? longDate.format(date) : dateKey;
}

const shortDate = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** "Sa., 17. Okt. 2026" for a `YYYY-MM-DD` key. Falls back to the key itself. */
export function formatDateShort(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return date ? shortDate.format(date) : dateKey;
}

const dateTime = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

/** "17.10.2026, 20:00" for an ISO timestamp, in the local time zone. */
export function formatDateTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return Number.isNaN(date.getTime()) ? isoTimestamp : dateTime.format(date);
}

const dayMonth = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long" });

/** "17. Oktober" for a `YYYY-MM-DD` key. Falls back to the key itself. */
export function formatDayMonth(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return date ? dayMonth.format(date) : dateKey;
}

const monthNarrow = new Intl.DateTimeFormat("de-DE", { month: "narrow" });

/** "J", "F", "M" … for the twelve months, for column headings. */
export const MONTH_INITIALS: readonly string[] = Array.from({ length: 12 }, (_unused, month) =>
  monthNarrow.format(new Date(2026, month, 1)),
);

const monthYear = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" });

/** "Oktober 2026" for a month from 1 to 12. */
export function formatMonthYear(year: number, month: number): string {
  return monthYear.format(new Date(year, month - 1, 1));
}

const monthName = new Intl.DateTimeFormat("de-DE", { month: "long" });

export function formatMonthName(month: number): string {
  return monthName.format(new Date(2026, month - 1, 1));
}

const weekdayShort = new Intl.DateTimeFormat("de-DE", { weekday: "short" });

/** "Mo.", "Di." … Monday first, for the heading of the stamp calendar. */
export const WEEKDAY_SHORT: readonly string[] = Array.from({ length: 7 }, (_unused, index) =>
  weekdayShort.format(new Date(2026, 5, 1 + index)),
);

/** Spoken name of a pickable icon. Anything else, such as an old emoji, is returned unchanged. */
export function iconName(name: string): string {
  const labels: Readonly<Record<string, string>> = de.icons;
  return labels[name] ?? name;
}

import { monthDateKeys } from "./calendar";
import { createEmptyDay } from "./defaults";
import type { AppDocument, Day, Option, Tracker } from "./types";

export interface DocumentSummary {
  readonly days: number;
  /** Day and tracker pairs that have something picked. */
  readonly marks: number;
  readonly logItems: number;
}

/** The stored day, or an empty one when nothing was recorded. Never stores the empty day. */
export function getDay(doc: AppDocument, dateKey: string): Day {
  return doc.days[dateKey] ?? createEmptyDay();
}

export function getTracker(doc: AppDocument, trackerId: string): Tracker | undefined {
  return doc.trackers.find((tracker) => tracker.id === trackerId);
}

export function summarize(doc: AppDocument): DocumentSummary {
  const days = Object.values(doc.days);
  return {
    days: days.length,
    marks: days.reduce(
      (total, day) => total + Object.values(day.marks).filter((ids) => ids.length > 0).length,
      0,
    ),
    logItems: doc.logItems.length,
  };
}

/** The option ids picked for a tracker on a day. */
export function pickedOptionIds(doc: AppDocument, dateKey: string, trackerId: string): string[] {
  return getDay(doc, dateKey).marks[trackerId] ?? [];
}

/** Trackers recorded daily (everything except logs). */
export function dailyTrackers(doc: AppDocument): Tracker[] {
  return doc.trackers.filter((tracker) => tracker.kind !== "log");
}

export interface DayProgress {
  readonly filled: number;
  readonly total: number;
}

/** How many daily trackers have something picked on that day. */
export function dayProgress(doc: AppDocument, dateKey: string): DayProgress {
  const daily = dailyTrackers(doc);
  const filled = daily.filter(
    (tracker) => pickedOptionIds(doc, dateKey, tracker.id).length > 0,
  ).length;
  return { filled, total: daily.length };
}

export interface OptionCounts {
  /** Days per option id. */
  readonly byOption: Readonly<Record<string, number>>;
  /** Days that point at an option which no longer exists. */
  readonly unknown: number;
}

/**
 * Counts days per option for a period: pass `"2026"` for a year or `"2026-10"` for a month.
 * Habits count every habit of a day separately.
 */
export function optionCounts(doc: AppDocument, trackerId: string, period: string): OptionCounts {
  const tracker = getTracker(doc, trackerId);
  const known = new Set(tracker?.options.map((option) => option.id));
  const byOption: Record<string, number> = {};
  let unknown = 0;
  for (const [dateKey, day] of Object.entries(doc.days)) {
    if (!dateKey.startsWith(period)) {
      continue;
    }
    for (const optionId of day.marks[trackerId] ?? []) {
      if (known.has(optionId)) {
        byOption[optionId] = (byOption[optionId] ?? 0) + 1;
      } else {
        unknown += 1;
      }
    }
  }
  return { byOption, unknown };
}

/** In how many days an option is used. Asked before deleting an option. */
export function optionUsage(doc: AppDocument, trackerId: string, optionId: string): number {
  return Object.values(doc.days).filter((day) => day.marks[trackerId]?.includes(optionId)).length;
}

export function findOption(tracker: Tracker, optionId: string): Option | undefined {
  return tracker.options.find((option) => option.id === optionId);
}

export const BACKUP_REMINDER_DAYS = 7;

/** "never": data exists but was never exported. "stale": the last export is a week old or more. */
export type BackupReminder = "never" | "stale";

export function backupReminder(
  lastExportedAt: string | null,
  markCount: number,
  now: Date,
): BackupReminder | null {
  if (markCount === 0) {
    return null;
  }
  if (lastExportedAt === null) {
    return "never";
  }
  const ageDays = (now.getTime() - new Date(lastExportedAt).getTime()) / 86_400_000;
  return Number.isNaN(ageDays) || ageDays >= BACKUP_REMINDER_DAYS ? "stale" : null;
}

/** On how many days of a period (`"2026"` or `"2026-10"`) something is picked for the tracker. */
export function markedDays(doc: AppDocument, trackerId: string, period: string): number {
  return Object.entries(doc.days).filter(
    ([dateKey, day]) => dateKey.startsWith(period) && (day.marks[trackerId]?.length ?? 0) > 0,
  ).length;
}

export interface DayCount {
  readonly dateKey: string;
  readonly day: number;
  /** How many options are picked for the tracker on that day. */
  readonly count: number;
}

/** Every real day of a month with the number of picks, for habit trackers. */
export function pickCountsOfMonth(
  doc: AppDocument,
  trackerId: string,
  year: number,
  month: number,
): DayCount[] {
  return monthDateKeys(year, month).map((dateKey) => ({
    dateKey,
    day: Number(dateKey.slice(8, 10)),
    count: getDay(doc, dateKey).marks[trackerId]?.length ?? 0,
  }));
}

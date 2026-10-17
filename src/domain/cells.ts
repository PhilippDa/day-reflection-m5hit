import { toKey, yearGrid } from "./calendar";
import { addDays, isDateKey } from "./dates";
import { getDay } from "./selectors";
import type { AppDocument, Option, Tracker } from "./types";

/**
 * - invalid: a day that does not exist (Feb 30)
 * - empty: nothing recorded
 * - marked: an option that exists in the tracker
 * - unknown: an option that was deleted later
 */
export type CellStatus = "invalid" | "empty" | "marked" | "unknown";

export interface TrackerCell {
  readonly month: number;
  readonly day: number;
  readonly dateKey: string | null;
  readonly status: CellStatus;
  /** The first picked option, when `status` is "marked". */
  readonly option: Option | null;
}

function buildCell(
  doc: AppDocument,
  tracker: Tracker,
  month: number,
  day: number,
  dateKey: string | null,
): TrackerCell {
  if (dateKey === null) {
    return { month, day, dateKey, status: "invalid", option: null };
  }
  const optionId = getDay(doc, dateKey).marks[tracker.id]?.[0];
  if (optionId === undefined) {
    return { month, day, dateKey, status: "empty", option: null };
  }
  const option = tracker.options.find((candidate) => candidate.id === optionId);
  return option
    ? { month, day, dateKey, status: "marked", option }
    : { month, day, dateKey, status: "unknown", option: null };
}

/** A year as 31 rows by 12 columns. Empty when the tracker does not exist. */
export function yearCells(doc: AppDocument, trackerId: string, year: number): TrackerCell[][] {
  const tracker = doc.trackers.find((candidate) => candidate.id === trackerId);
  if (!tracker) {
    return [];
  }
  return yearGrid(year).map((row) =>
    row.map((cell) => buildCell(doc, tracker, cell.month, cell.day, cell.dateKey)),
  );
}

/** The days of one month in order. Days that do not exist are not included. */
export function monthCells(
  doc: AppDocument,
  trackerId: string,
  year: number,
  month: number,
): TrackerCell[] {
  const tracker = doc.trackers.find((candidate) => candidate.id === trackerId);
  if (!tracker) {
    return [];
  }
  const cells: TrackerCell[] = [];
  for (let day = 1; day <= 31; day += 1) {
    const dateKey = toKey(year, month, day);
    if (dateKey !== null) {
      cells.push(buildCell(doc, tracker, month, day, dateKey));
    }
  }
  return cells;
}

/** The last `count` days up to and including `endKey`, oldest first. For small previews. */
export function recentCells(
  doc: AppDocument,
  trackerId: string,
  endKey: string,
  count: number,
): TrackerCell[] {
  const tracker = doc.trackers.find((candidate) => candidate.id === trackerId);
  if (!tracker || !isDateKey(endKey)) {
    return [];
  }
  return Array.from({ length: count }, (_unused, index) => {
    const dateKey = addDays(endKey, index - (count - 1));
    return buildCell(
      doc,
      tracker,
      Number(dateKey.slice(5, 7)),
      Number(dateKey.slice(8, 10)),
      dateKey,
    );
  });
}

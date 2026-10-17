import { isDateKey } from "./dates";
import type { AppDocument, LogItem, Tracker } from "./types";

// Items of a log tracker, such as a movie with a date and stars.

export interface LogItemPatch {
  readonly date?: string;
  readonly title?: string;
  readonly rating?: number;
  readonly note?: string;
}

/** A log tracker whose entries are only a date and a text, such as the notes. */
export function isTextTracker(tracker: Tracker): boolean {
  return tracker.kind === "log" && tracker.entries === "text";
}

function validRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 0 && rating <= 5;
}

/**
 * Adds an item to a log tracker. A blank title, a bad date or a rating outside 0 to 5 is rejected.
 * In a notes tracker the text must not be blank instead, and title and rating stay empty.
 */
export function addLogItem(doc: AppDocument, item: LogItem): AppDocument {
  const tracker = doc.trackers.find((candidate) => candidate.id === item.trackerId);
  if (
    tracker?.kind !== "log" ||
    !isDateKey(item.date) ||
    !validRating(item.rating) ||
    doc.logItems.some((existing) => existing.id === item.id)
  ) {
    return doc;
  }
  if (isTextTracker(tracker)) {
    return item.note.trim() === ""
      ? doc
      : { ...doc, logItems: [...doc.logItems, { ...item, title: "", rating: 0 }] };
  }
  const title = item.title.trim();
  return title === "" ? doc : { ...doc, logItems: [...doc.logItems, { ...item, title }] };
}

/**
 * A blank title, a bad date or a rating outside 0 to 5 is ignored. In a notes tracker only the date
 * and the text can change, and the text must not become blank.
 */
export function updateLogItem(doc: AppDocument, itemId: string, patch: LogItemPatch): AppDocument {
  const item = doc.logItems.find((candidate) => candidate.id === itemId);
  if (!item) {
    return doc;
  }
  const tracker = doc.trackers.find((candidate) => candidate.id === item.trackerId);
  const text = tracker !== undefined && isTextTracker(tracker);
  const title = patch.title?.trim();
  const note = text && patch.note?.trim() === "" ? undefined : patch.note;
  const updated: LogItem = {
    ...item,
    ...(title && !text ? { title } : {}),
    ...(patch.date !== undefined && isDateKey(patch.date) ? { date: patch.date } : {}),
    ...(patch.rating !== undefined && validRating(patch.rating) && !text
      ? { rating: patch.rating }
      : {}),
    ...(note === undefined ? {} : { note }),
  };
  const same =
    updated.title === item.title &&
    updated.date === item.date &&
    updated.rating === item.rating &&
    updated.note === item.note;
  return same
    ? doc
    : {
        ...doc,
        logItems: doc.logItems.map((candidate) => (candidate.id === itemId ? updated : candidate)),
      };
}

export function deleteLogItem(doc: AppDocument, itemId: string): AppDocument {
  if (!doc.logItems.some((item) => item.id === itemId)) {
    return doc;
  }
  return { ...doc, logItems: doc.logItems.filter((item) => item.id !== itemId) };
}

/** The items of one log tracker, oldest first. Items on the same day keep their order. */
export function logItemsOf(doc: AppDocument, trackerId: string): LogItem[] {
  return doc.logItems
    .filter((item) => item.trackerId === trackerId)
    .toSorted((a, b) => a.date.localeCompare(b.date));
}

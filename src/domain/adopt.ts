import { isTextTracker } from "./logs";
import { setNote } from "./marks";
import type { AppDocument, LogItem } from "./types";

/**
 * Turns the old one-note-per-day texts into entries of the first notes tracker, so nothing written
 * before that tracker existed disappears from view. The day's note is cleared afterwards, so a note
 * is never turned into an entry twice. Without a notes tracker, or without day notes, nothing
 * changes and the same document comes back.
 */
export function adoptDayNotes(doc: AppDocument, newId: (prefix: "log") => string): AppDocument {
  const tracker = doc.trackers.find(isTextTracker);
  if (!tracker) {
    return doc;
  }
  const dated = Object.entries(doc.days)
    .filter(([, day]) => day.note.trim() !== "")
    .toSorted(([a], [b]) => a.localeCompare(b));
  if (dated.length === 0) {
    return doc;
  }
  const items: LogItem[] = dated.map(([date, day]) => ({
    id: newId("log"),
    trackerId: tracker.id,
    date,
    title: "",
    rating: 0,
    note: day.note,
  }));
  const cleared = dated.reduce((next, [date]) => setNote(next, date, ""), doc);
  return { ...cleared, logItems: [...cleared.logItems, ...items] };
}

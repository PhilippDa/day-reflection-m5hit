import { createEmptyDay } from "./defaults";
import { isDateKey } from "./dates";
import type { AppDocument, Day } from "./types";

// Recording what happened on a day. Pure, and a rejected or no-op change returns the same document.

/** Stores the day, or removes it when nothing is picked and there is no note. */
function writeDay(doc: AppDocument, dateKey: string, day: Day): AppDocument {
  const marks = Object.fromEntries(Object.entries(day.marks).filter(([, ids]) => ids.length > 0));
  const keep = Object.keys(marks).length > 0 || day.note !== "";
  const others = Object.entries(doc.days).filter(([key]) => key !== dateKey);
  const days = Object.fromEntries(keep ? [...others, [dateKey, { ...day, marks }]] : others);
  return { ...doc, days };
}

function writeMarks(
  doc: AppDocument,
  dateKey: string,
  trackerId: string,
  optionIds: readonly string[],
): AppDocument {
  const day = doc.days[dateKey] ?? createEmptyDay();
  const current = day.marks[trackerId] ?? [];
  if (
    current.length === optionIds.length &&
    current.every((id, index) => id === optionIds[index])
  ) {
    return doc;
  }
  return writeDay(doc, dateKey, { ...day, marks: { ...day.marks, [trackerId]: [...optionIds] } });
}

function recordingTracker(doc: AppDocument, dateKey: string, trackerId: string, optionId: string) {
  const tracker = doc.trackers.find((candidate) => candidate.id === trackerId);
  const known = tracker?.options.some((option) => option.id === optionId) ?? false;
  return isDateKey(dateKey) && tracker && known ? tracker : undefined;
}

/** Picks the one option of a choice tracker for a day, replacing any earlier pick. */
export function setChoice(
  doc: AppDocument,
  dateKey: string,
  trackerId: string,
  optionId: string,
): AppDocument {
  const tracker = recordingTracker(doc, dateKey, trackerId, optionId);
  return tracker?.kind === "choice" ? writeMarks(doc, dateKey, trackerId, [optionId]) : doc;
}

/** What a tap on a legend chip does: pick it, or clear it when it was already picked. */
export function toggleChoice(
  doc: AppDocument,
  dateKey: string,
  trackerId: string,
  optionId: string,
): AppDocument {
  const tracker = recordingTracker(doc, dateKey, trackerId, optionId);
  if (tracker?.kind !== "choice") {
    return doc;
  }
  const picked = doc.days[dateKey]?.marks[trackerId] ?? [];
  return writeMarks(
    doc,
    dateKey,
    trackerId,
    picked.length === 1 && picked[0] === optionId ? [] : [optionId],
  );
}

/** Switches one habit on or off for a day. The others stay as they are. */
export function toggleHabit(
  doc: AppDocument,
  dateKey: string,
  trackerId: string,
  optionId: string,
): AppDocument {
  const tracker = recordingTracker(doc, dateKey, trackerId, optionId);
  if (tracker?.kind !== "habits") {
    return doc;
  }
  const picked = doc.days[dateKey]?.marks[trackerId] ?? [];
  const next = picked.includes(optionId)
    ? picked.filter((id) => id !== optionId)
    : [...picked, optionId];
  return writeMarks(doc, dateKey, trackerId, next);
}

/** Removes everything picked for a tracker on a day. */
export function clearMarks(doc: AppDocument, dateKey: string, trackerId: string): AppDocument {
  if (!isDateKey(dateKey) || !doc.trackers.some((tracker) => tracker.id === trackerId)) {
    return doc;
  }
  return writeMarks(doc, dateKey, trackerId, []);
}

/** The note of a day. Creates the day if needed, and removes it again when everything is empty. */
export function setNote(doc: AppDocument, dateKey: string, note: string): AppDocument {
  if (!isDateKey(dateKey)) {
    return doc;
  }
  const day = doc.days[dateKey] ?? createEmptyDay();
  return day.note === note ? doc : writeDay(doc, dateKey, { ...day, note });
}

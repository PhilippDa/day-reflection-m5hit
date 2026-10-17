import type { AppDocument, Day, Tracker } from "./types";

/** Items with the same id are replaced in place by the incoming one. New ones are appended. */
function unionById<T extends { readonly id: string }>(
  base: readonly T[],
  incoming: readonly T[],
): T[] {
  const incomingById = new Map(incoming.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const merged = base.map((item) => {
    seen.add(item.id);
    return incomingById.get(item.id) ?? item;
  });
  for (const item of incoming) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  }
  return merged;
}

/** Same tracker in both: the incoming fields win, and the legends are united by option id. */
function mergeTracker(base: Tracker, incoming: Tracker): Tracker {
  return { ...incoming, options: unionById(base.options, incoming.options) };
}

function mergeTrackers(base: readonly Tracker[], incoming: readonly Tracker[]): Tracker[] {
  const incomingById = new Map(incoming.map((tracker) => [tracker.id, tracker]));
  const seen = new Set<string>();
  const merged = base.map((tracker) => {
    seen.add(tracker.id);
    const other = incomingById.get(tracker.id);
    return other ? mergeTracker(tracker, other) : tracker;
  });
  for (const tracker of incoming) {
    if (!seen.has(tracker.id)) {
      merged.push(tracker);
    }
  }
  return merged;
}

/** Per tracker the incoming picks win when there are any. The incoming note wins when it is not empty. */
function mergeDay(base: Day, incoming: Day): Day {
  const marks = { ...base.marks };
  for (const [trackerId, optionIds] of Object.entries(incoming.marks)) {
    if (optionIds.length > 0) {
      marks[trackerId] = optionIds;
    }
  }
  return { ...base, marks, note: incoming.note === "" ? base.note : incoming.note };
}

/**
 * Merges `incoming` into `base`. On an id conflict the incoming item wins, and an empty incoming
 * pick or note never erases anything. Nothing in `base` is ever dropped.
 */
export function mergeDocuments(base: AppDocument, incoming: AppDocument): AppDocument {
  const days = { ...base.days };
  for (const [key, incomingDay] of Object.entries(incoming.days)) {
    const baseDay = days[key];
    days[key] = baseDay ? mergeDay(baseDay, incomingDay) : incomingDay;
  }
  return {
    ...base,
    trackers: mergeTrackers(base.trackers, incoming.trackers),
    days,
    logItems: unionById(base.logItems, incoming.logItems),
  };
}

export type ImportMode = "replace" | "merge";

export function applyImport(
  current: AppDocument,
  incoming: AppDocument,
  mode: ImportMode,
): AppDocument {
  return mode === "replace" ? incoming : mergeDocuments(current, incoming);
}

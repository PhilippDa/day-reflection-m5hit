import * as v from "valibot";
import { optionSchema, trackerSchema, VIEWS_BY_KIND } from "./schema";
import type { AppDocument, Day, Option, Tracker, TrackerView } from "./types";

// Operations on the structure: trackers and their legends. Pure, like every domain operation:
// a rejected or no-op change returns the very same document object, so callers can compare
// references. Ids are passed in.
//
// Marks reference options by id, so editing an option changes how the past is drawn on purpose.
// Deleting an option never removes marks: those days show as "unknown". Deleting a tracker does
// remove its marks and log items, and the UI asks first.

export interface TrackerPatch {
  readonly title?: string;
  readonly icon?: string;
  readonly view?: TrackerView;
}

export interface OptionPatch {
  readonly label?: string;
  readonly color?: string;
  readonly icon?: string;
  readonly shape?: Option["shape"];
}

function viewFits(tracker: Pick<Tracker, "kind">, view: string): boolean {
  return (VIEWS_BY_KIND[tracker.kind] as readonly string[]).includes(view);
}

function isValidOption(option: Option): boolean {
  return option.label.trim() !== "" && v.safeParse(optionSchema, option).success;
}

function cleanOption(option: Option): Option {
  return { ...option, label: option.label.trim(), icon: option.icon.trim() };
}

/** Adds a finished tracker, for example one made from a preset. Anything invalid is rejected. */
export function addTracker(doc: AppDocument, tracker: Tracker): AppDocument {
  const title = tracker.title.trim();
  const options = tracker.options.map(cleanOption);
  const optionIds = new Set(options.map((option) => option.id));
  const fitsKind = tracker.kind === "log" ? options.length === 0 : options.length > 0;
  const valid =
    title !== "" &&
    fitsKind &&
    optionIds.size === options.length &&
    options.every(isValidOption) &&
    !doc.trackers.some((existing) => existing.id === tracker.id) &&
    v.safeParse(trackerSchema, { ...tracker, title, options }).success;
  if (!valid) {
    return doc;
  }
  return { ...doc, trackers: [...doc.trackers, { ...tracker, title, options }] };
}

function replaceTracker(
  doc: AppDocument,
  trackerId: string,
  change: (tracker: Tracker) => Tracker,
): AppDocument {
  const tracker = doc.trackers.find((candidate) => candidate.id === trackerId);
  if (!tracker) {
    return doc;
  }
  const updated = change(tracker);
  if (updated === tracker) {
    return doc;
  }
  return {
    ...doc,
    trackers: doc.trackers.map((candidate) => (candidate.id === trackerId ? updated : candidate)),
  };
}

/** A blank title and a view that does not fit the kind are ignored. The icon may be empty. */
export function updateTracker(
  doc: AppDocument,
  trackerId: string,
  patch: TrackerPatch,
): AppDocument {
  return replaceTracker(doc, trackerId, (tracker) => {
    const title = patch.title?.trim();
    const icon = patch.icon?.trim();
    const view = patch.view !== undefined && viewFits(tracker, patch.view) ? patch.view : undefined;
    const updated: Tracker = {
      ...tracker,
      ...(title ? { title } : {}),
      ...(icon === undefined ? {} : { icon }),
      ...(view === undefined ? {} : { view }),
    };
    return updated.title === tracker.title &&
      updated.icon === tracker.icon &&
      updated.view === tracker.view
      ? tracker
      : updated;
  });
}

function pruneDay(day: Day): Day | undefined {
  const marks = Object.fromEntries(Object.entries(day.marks).filter(([, ids]) => ids.length > 0));
  return Object.keys(marks).length > 0 || day.note !== "" ? { ...day, marks } : undefined;
}

/** Removes the tracker together with its marks and log items. Days left empty disappear. */
export function deleteTracker(doc: AppDocument, trackerId: string): AppDocument {
  if (!doc.trackers.some((tracker) => tracker.id === trackerId)) {
    return doc;
  }
  const days: Record<string, Day> = {};
  for (const [dateKey, day] of Object.entries(doc.days)) {
    const marks = Object.fromEntries(
      Object.entries(day.marks).filter(([key]) => key !== trackerId),
    );
    const kept = pruneDay({ ...day, marks });
    if (kept) {
      days[dateKey] = kept;
    }
  }
  return {
    ...doc,
    trackers: doc.trackers.filter((tracker) => tracker.id !== trackerId),
    days,
    logItems: doc.logItems.filter((item) => item.trackerId !== trackerId),
  };
}

function moveWithin<T>(items: readonly T[], index: number, delta: number): T[] | undefined {
  const target = index + delta;
  if (index < 0 || target < 0 || target >= items.length) {
    return undefined;
  }
  const moved = [...items];
  const [item] = moved.splice(index, 1);
  if (item === undefined) {
    return undefined;
  }
  moved.splice(target, 0, item);
  return moved;
}

/** Moves a tracker up (`-1`) or down (`1`) in the list. At the edge nothing changes. */
export function moveTracker(doc: AppDocument, trackerId: string, delta: number): AppDocument {
  const index = doc.trackers.findIndex((tracker) => tracker.id === trackerId);
  const moved = moveWithin(doc.trackers, index, delta);
  return moved ? { ...doc, trackers: moved } : doc;
}

/** Adds an option to a tracker that records options. Invalid or duplicate options are rejected. */
export function addOption(doc: AppDocument, trackerId: string, option: Option): AppDocument {
  return replaceTracker(doc, trackerId, (tracker) => {
    const cleaned = cleanOption(option);
    if (
      tracker.kind === "log" ||
      !isValidOption(cleaned) ||
      tracker.options.some((existing) => existing.id === cleaned.id)
    ) {
      return tracker;
    }
    return { ...tracker, options: [...tracker.options, cleaned] };
  });
}

/** A blank label or a color that is not `#rrggbb` is ignored. */
export function updateOption(
  doc: AppDocument,
  trackerId: string,
  optionId: string,
  patch: OptionPatch,
): AppDocument {
  return replaceTracker(doc, trackerId, (tracker) => {
    const option = tracker.options.find((candidate) => candidate.id === optionId);
    if (!option) {
      return tracker;
    }
    const label = patch.label?.trim();
    const icon = patch.icon?.trim();
    const candidate: Option = {
      ...option,
      ...(label ? { label } : {}),
      ...(icon === undefined ? {} : { icon }),
      ...(patch.color === undefined ? {} : { color: patch.color }),
      ...(patch.shape === undefined ? {} : { shape: patch.shape }),
    };
    const updated = isValidOption(candidate) ? candidate : option;
    const same =
      updated.label === option.label &&
      updated.icon === option.icon &&
      updated.color === option.color &&
      updated.shape === option.shape;
    return same
      ? tracker
      : {
          ...tracker,
          options: tracker.options.map((existing) =>
            existing.id === optionId ? updated : existing,
          ),
        };
  });
}

/**
 * The last option cannot be deleted, so a tracker can always record something. Marks that
 * point at the deleted option stay in the data and show up as "unknown" days.
 */
export function deleteOption(doc: AppDocument, trackerId: string, optionId: string): AppDocument {
  return replaceTracker(doc, trackerId, (tracker) => {
    const remaining = tracker.options.filter((option) => option.id !== optionId);
    if (remaining.length === tracker.options.length || remaining.length === 0) {
      return tracker;
    }
    return { ...tracker, options: remaining };
  });
}

export function moveOption(
  doc: AppDocument,
  trackerId: string,
  optionId: string,
  delta: number,
): AppDocument {
  return replaceTracker(doc, trackerId, (tracker) => {
    const index = tracker.options.findIndex((option) => option.id === optionId);
    const moved = moveWithin(tracker.options, index, delta);
    return moved ? { ...tracker, options: moved } : tracker;
  });
}

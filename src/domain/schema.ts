import * as v from "valibot";
import { isDateKey } from "./dates";

export const CURRENT_VERSION = 2;

export const TRACKER_KINDS = ["choice", "habits", "log"] as const;

export const TRACKER_VIEWS = [
  "year-squares",
  "year-dots",
  "month-ring",
  "month-stamps",
  "board",
  "list",
] as const;

/** Which ways of drawing a tracker make sense for what it records. */
export const VIEWS_BY_KIND = {
  choice: ["year-squares", "year-dots", "month-ring", "month-stamps"],
  habits: ["board"],
  log: ["list"],
} as const satisfies Record<
  (typeof TRACKER_KINDS)[number],
  readonly (typeof TRACKER_VIEWS)[number][]
>;

/** Block shapes for habits on the board. The empty string means "no shape". */
export const SHAPE_IDS = ["single", "domino", "i", "o", "s", "z", "t", "l", "j"] as const;

const id = v.pipe(v.string(), v.minLength(1));
const dateKey = v.pipe(v.string(), v.check(isDateKey, "Not a calendar date in YYYY-MM-DD form"));
const hexColor = v.pipe(v.string(), v.regex(/^#[0-9a-fA-F]{6}$/, "Not a #rrggbb color"));

// looseObject keeps unknown fields, so data written by a newer minor version survives a round trip.
export const optionSchema = v.looseObject({
  id,
  label: v.string(),
  color: hexColor,
  /** An emoji shown next to the label. May be empty. */
  icon: v.string(),
  shape: v.picklist(["", ...SHAPE_IDS]),
});

export const trackerSchema = v.pipe(
  v.looseObject({
    id,
    title: v.string(),
    icon: v.string(),
    kind: v.picklist(TRACKER_KINDS),
    view: v.picklist(TRACKER_VIEWS),
    options: v.array(optionSchema),
    /** Log trackers only: "text" entries are a date and a text, without title or stars. */
    entries: v.optional(v.picklist(["titled", "text"])),
  }),
  v.check(
    (tracker) => (VIEWS_BY_KIND[tracker.kind] as readonly string[]).includes(tracker.view),
    "The view does not fit the kind of tracker",
  ),
);

// Marks name options by id. An id may point at an option that was deleted later: the UI shows
// such a day as "unknown" instead of losing it.
export const daySchema = v.looseObject({
  marks: v.record(id, v.array(id)),
  note: v.string(),
});

export const logItemSchema = v.looseObject({
  id,
  trackerId: id,
  date: dateKey,
  title: v.string(),
  /** 1 to 5 stars, 0 for unrated. */
  rating: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(5)),
  note: v.string(),
});

export const documentSchema = v.looseObject({
  version: v.literal(CURRENT_VERSION),
  trackers: v.array(trackerSchema),
  days: v.record(dateKey, daySchema),
  logItems: v.array(logItemSchema),
});

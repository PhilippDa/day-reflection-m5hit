import { CURRENT_VERSION } from "./schema";
import type { AppDocument, Day } from "./types";

export function createEmptyDay(): Day {
  return { marks: {}, note: "" };
}

/** A new document has no trackers: the user picks presets on the first start. */
export function createEmptyDocument(): AppDocument {
  return { version: CURRENT_VERSION, trackers: [], days: {}, logItems: [] };
}

import { createEmptyDocument } from "./defaults";
import { createTrackerFromPreset, PRESETS } from "./presets";
import type { AppDocument, Tracker } from "./types";

// Test helpers: trackers built from the real presets, with predictable ids.
// `trk_weather`, `opt_weather_1` (Sonnig), `opt_weather_2` (Bewölkt), and so on.

export function trackerFrom(key: string): Tracker {
  const preset = PRESETS.find((candidate) => candidate.key === key);
  if (!preset) {
    throw new Error(`Unknown preset: ${key}`);
  }
  let counter = 0;
  return createTrackerFromPreset(preset, (prefix) =>
    prefix === "trk" ? `trk_${key}` : `opt_${key}_${String((counter += 1))}`,
  );
}

export function documentWith(...keys: string[]): AppDocument {
  return { ...createEmptyDocument(), trackers: keys.map(trackerFrom) };
}

import type { AppDocument, Option, Tracker } from "./types";

/**
 * The icons a tracker or an option can show: Material Symbols names, in the order of the picker.
 * A stored icon is one of these names, an old emoji, or empty. The drawings live in the UI.
 */
export const ICON_NAMES = [
  // weather
  "sunny",
  "partly_cloudy_day",
  "cloud",
  "rainy",
  "thunderstorm",
  "weather_snowy",
  "foggy",
  "air",
  "water_drop",
  "nights_stay",
  // feelings
  "mood",
  "sentiment_neutral",
  "sentiment_sad",
  "sentiment_stressed",
  "sentiment_very_satisfied",
  "favorite",
  "bedtime",
  "self_improvement",
  "spa",
  "psychology",
  "auto_awesome",
  "star",
  // care and home
  "shower",
  "bathtub",
  "bubble_chart",
  "clean_hands",
  "cleaning_services",
  "local_laundry_service",
  "dishwasher_gen",
  "home",
  // moving
  "directions_walk",
  "directions_run",
  "directions_bike",
  "hiking",
  "fitness_center",
  "pool",
  "pets",
  // eating and drinking
  "restaurant",
  "local_cafe",
  "nutrition",
  "egg_alt",
  "cake",
  "bakery_dining",
  "water_full",
  // reading, making, watching
  "menu_book",
  "auto_stories",
  "edit_note",
  "sticky_note_2",
  "lightbulb",
  "school",
  "work",
  "music_note",
  "headphones",
  "movie",
  "theaters",
  "sports_esports",
  "brush",
  "palette",
  "photo_camera",
  // nature, going out, health
  "celebration",
  "local_florist",
  "eco",
  "park",
  "flight",
  "directions_car",
  "shopping_bag",
  "savings",
  "medication",
  "monitor_heart",
  "healing",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export function isIconName(value: string): value is IconName {
  return (ICON_NAMES as readonly string[]).includes(value);
}

/** The emoji the starter trackers used to have, and the icon that replaces each. */
export const LEGACY_EMOJI: Readonly<Record<string, IconName>> = {
  "🌤️": "partly_cloudy_day",
  "☀️": "sunny",
  "☁️": "cloud",
  "⛅": "partly_cloudy_day",
  "🌧️": "rainy",
  "⛈️": "thunderstorm",
  "❄️": "weather_snowy",
  "🌫️": "foggy",
  "😰": "sentiment_stressed",
  "⭐": "star",
  "😴": "bedtime",
  "🚿": "shower",
  "💦": "water_drop",
  "🛁": "bathtub",
  "🫧": "bubble_chart",
  "✨": "auto_awesome",
  "💭": "nights_stay",
  "🐾": "pets",
  "🎬": "movie",
  "📝": "edit_note",
  "🧹": "cleaning_services",
  "🌸": "local_florist",
};

function modernIcon(icon: string): string {
  return LEGACY_EMOJI[icon] ?? icon;
}

function modernOption(option: Option): Option {
  const icon = modernIcon(option.icon);
  return icon === option.icon ? option : { ...option, icon };
}

function modernTracker(tracker: Tracker): Tracker {
  const icon = modernIcon(tracker.icon);
  const options = tracker.options.map(modernOption);
  const changed =
    icon !== tracker.icon || options.some((option, i) => option !== tracker.options[i]);
  return changed ? { ...tracker, icon, options } : tracker;
}

/**
 * Swaps the old starter emoji for their icons. Emoji the user typed themselves have no icon and
 * stay as they are. Returns the same document when nothing needs to change.
 */
export function modernizeIcons(doc: AppDocument): AppDocument {
  const trackers = doc.trackers.map(modernTracker);
  return trackers.some((tracker, i) => tracker !== doc.trackers[i]) ? { ...doc, trackers } : doc;
}

import type { Option, ShapeId, Tracker, TrackerKind, TrackerView } from "./types";

// Starter trackers, offered on the first start and in the settings. They are seed data, not UI
// text: once added, the user edits all of it. Nothing here is personal data.

export interface PresetOption {
  readonly label: string;
  readonly color: string;
  readonly icon?: string;
  readonly shape?: ShapeId;
}

export interface Preset {
  readonly key: string;
  readonly title: string;
  readonly icon: string;
  readonly description: string;
  readonly kind: TrackerKind;
  readonly view: TrackerView;
  readonly options: readonly PresetOption[];
  /** Log presets only: "text" for entries that are just a date and a text. */
  readonly entries?: "text";
  /** Health data: listed like the others but never selected by default. */
  readonly sensitive?: boolean;
}

export const PRESETS: readonly Preset[] = [
  {
    key: "weather",
    title: "Wetter",
    icon: "partly_cloudy_day",
    description: "Wie war das Wetter heute?",
    kind: "choice",
    view: "year-squares",
    options: [
      { label: "Sonnig", color: "#f6c945", icon: "sunny" },
      { label: "Bewölkt", color: "#9a9a9a", icon: "cloud" },
      { label: "Wolkig-heiter", color: "#b6d95a", icon: "partly_cloudy_day" },
      { label: "Regen", color: "#8fd0f0", icon: "rainy" },
      { label: "Gewitter", color: "#4b4fa3", icon: "thunderstorm" },
      { label: "Schnee", color: "#ffffff", icon: "weather_snowy" },
      { label: "Nebel", color: "#b9a3e3", icon: "foggy" },
    ],
  },
  {
    key: "stress",
    title: "Stress",
    icon: "sentiment_stressed",
    description: "Wie gestresst warst du?",
    kind: "choice",
    view: "year-squares",
    options: [
      { label: "Extrem", color: "#8e2c48" },
      { label: "Hoch", color: "#d64550" },
      { label: "Mittel", color: "#f59e42" },
      { label: "Niedrig", color: "#f6c945" },
      { label: "Keiner", color: "#6cbf5e" },
    ],
  },
  {
    key: "rating",
    title: "Tagesbewertung",
    icon: "star",
    description: "Wie war der Tag insgesamt? 1 bis 5 Sterne.",
    kind: "choice",
    view: "year-squares",
    options: [
      { label: "5 Sterne", color: "#4b4fa3" },
      { label: "4 Sterne", color: "#7b5ea7" },
      { label: "3 Sterne", color: "#c2549d" },
      { label: "2 Sterne", color: "#f29ac0" },
      { label: "1 Stern", color: "#b9a3e3" },
    ],
  },
  {
    key: "sleep",
    title: "Schlaf",
    icon: "bedtime",
    description: "Wie lange hast du geschlafen? Als Ring für einen Monat.",
    kind: "choice",
    view: "month-ring",
    options: [
      { label: "bis 4 Stunden", color: "#ffffff" },
      { label: "4 bis 6 Stunden", color: "#8fd9c0" },
      { label: "6 bis 8 Stunden", color: "#4a90d9" },
      { label: "8 bis 10 Stunden", color: "#b9a3e3" },
      { label: "10 bis 12 Stunden", color: "#7b5ea7" },
      { label: "über 12 Stunden", color: "#f29ac0" },
    ],
  },
  {
    key: "shower",
    title: "Duschen",
    icon: "shower",
    description: "Wie hast du dich heute gewaschen? Als Ring für einen Monat.",
    kind: "choice",
    view: "month-ring",
    options: [
      { label: "Nichts", color: "#ffffff" },
      { label: "Kurz abgewaschen", color: "#8fd0f0", icon: "water_drop" },
      { label: "Dusche", color: "#8fd9c0", icon: "shower" },
      { label: "Bad", color: "#f29ac0", icon: "bathtub" },
      { label: "Schaumbad", color: "#c2549d", icon: "bubble_chart" },
      { label: "Alles-Dusche", color: "#b9a3e3", icon: "auto_awesome" },
    ],
  },
  {
    key: "dream",
    title: "Traum",
    icon: "nights_stay",
    description: "Was hast du geträumt?",
    kind: "choice",
    view: "year-dots",
    options: [
      { label: "Erinnere mich nicht", color: "#ffffff" },
      { label: "Glücklich", color: "#f29ac0" },
      { label: "Lustig", color: "#4a90d9" },
      { label: "Seltsam", color: "#b9a3e3" },
      { label: "Traurig", color: "#8fd0f0" },
      { label: "Gruselig", color: "#2fa4a0" },
      { label: "Albtraum", color: "#8e2c48" },
    ],
  },
  {
    key: "steps",
    title: "Schritte",
    icon: "pets",
    description: "Wie viele Schritte bist du gegangen? Als Pfotenspur für einen Monat.",
    kind: "choice",
    view: "month-stamps",
    options: [
      { label: "0 bis 3 Tausend", color: "#f59e42" },
      { label: "3 bis 6 Tausend", color: "#d64550" },
      { label: "6 bis 9 Tausend", color: "#8e2c48" },
      { label: "über 9 Tausend", color: "#3b3b3b" },
    ],
  },
  {
    key: "movies",
    title: "Filme",
    icon: "movie",
    description: "Filme, die du gesehen hast, mit Sternen.",
    kind: "log",
    view: "list",
    options: [],
  },
  {
    key: "notes",
    title: "Notizen",
    icon: "edit_note",
    description: "Kurze Notizen zu deinem Tag, mit Datum.",
    kind: "log",
    view: "list",
    options: [],
    entries: "text",
  },
  {
    key: "household",
    title: "Haushalt-Board",
    icon: "cleaning_services",
    description: "Jede erledigte Aufgabe füllt das Spielfeld mit einem Block.",
    kind: "habits",
    view: "board",
    options: [
      { label: "Schreibtisch aufräumen", color: "#f6c945", shape: "single" },
      { label: "Müll rausbringen", color: "#6cbf5e", shape: "domino" },
      { label: "Früh aufstehen", color: "#d64550", shape: "i" },
      { label: "Geschirr spülen", color: "#8e2c48", shape: "o" },
      { label: "Spazieren gehen", color: "#ef6f6c", shape: "s" },
      { label: "Bett machen", color: "#f59e42", shape: "t" },
      { label: "2 Liter Wasser trinken", color: "#b6d95a", shape: "l" },
      { label: "Lesen", color: "#4a90d9", shape: "z" },
      { label: "Wäsche waschen", color: "#a8764b", shape: "j" },
    ],
  },
  {
    key: "period",
    title: "Periode",
    icon: "local_florist",
    description: "Stärke der Blutung. Bleibt nur auf deinem Gerät und in deinen Sicherungen.",
    kind: "choice",
    view: "year-squares",
    sensitive: true,
    options: [
      { label: "Keine", color: "#ffffff" },
      { label: "Schmierblutung", color: "#f59e42" },
      { label: "Leicht", color: "#ef6f6c" },
      { label: "Mittel", color: "#d64550" },
      { label: "Stark", color: "#8e2c48" },
    ],
  },
];

export type IdFactory = (prefix: "trk" | "opt") => string;

/** A fresh tracker from a preset, with new ids so adding it twice never collides. */
export function createTrackerFromPreset(preset: Preset, newId: IdFactory): Tracker {
  const options: Option[] = preset.options.map((option) => ({
    id: newId("opt"),
    label: option.label,
    color: option.color,
    icon: option.icon ?? "",
    shape: option.shape ?? "",
  }));
  return {
    id: newId("trk"),
    title: preset.title,
    icon: preset.icon,
    kind: preset.kind,
    view: preset.view,
    options,
    ...(preset.entries ? { entries: preset.entries } : {}),
  };
}

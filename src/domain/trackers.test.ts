import { describe, expect, it } from "vitest";
import { documentWith, trackerFrom } from "./fixtures";
import { setChoice, setNote, toggleHabit } from "./marks";
import { addLogItem } from "./logs";
import {
  addOption,
  addTracker,
  deleteOption,
  deleteTracker,
  moveOption,
  moveTracker,
  updateOption,
  updateTracker,
} from "./trackers";
import { createEmptyDocument } from "./defaults";
import type { Option } from "./types";

const WEATHER = "trk_weather";
const SUN = "opt_weather_1";

const newOption: Option = {
  id: "opt_new",
  label: "Hagel",
  color: "#9a9a9a",
  icon: "🧊",
  shape: "",
};

describe("addTracker", () => {
  it("adds a valid tracker at the end", () => {
    const doc = addTracker(createEmptyDocument(), trackerFrom("weather"));
    expect(doc.trackers.map((tracker) => tracker.id)).toEqual([WEATHER]);
  });

  it("trims the title and the option labels", () => {
    const tracker = { ...trackerFrom("stress"), title: "  Stress  " };
    const first = tracker.options[0];
    if (!first) {
      throw new Error("no option");
    }
    const doc = addTracker(createEmptyDocument(), {
      ...tracker,
      options: [{ ...first, label: " Extrem " }],
    });
    expect(doc.trackers[0]?.title).toBe("Stress");
    expect(doc.trackers[0]?.options[0]?.label).toBe("Extrem");
  });

  it("rejects a blank title, a duplicate id and a bad color", () => {
    const doc = documentWith("weather");
    expect(addTracker(doc, { ...trackerFrom("stress"), title: " " })).toBe(doc);
    expect(addTracker(doc, trackerFrom("weather"))).toBe(doc);
    const stress = trackerFrom("stress");
    const first = stress.options[0];
    if (!first) {
      throw new Error("no option");
    }
    expect(addTracker(doc, { ...stress, options: [{ ...first, color: "red" }] })).toBe(doc);
  });

  it("rejects a choice tracker without options and a log tracker with options", () => {
    const doc = createEmptyDocument();
    expect(addTracker(doc, { ...trackerFrom("stress"), options: [] })).toBe(doc);
    expect(
      addTracker(doc, { ...trackerFrom("movies"), options: trackerFrom("stress").options }),
    ).toBe(doc);
  });

  it("rejects duplicate option ids and a view that does not fit the kind", () => {
    const doc = createEmptyDocument();
    const stress = trackerFrom("stress");
    const first = stress.options[0];
    if (!first) {
      throw new Error("no option");
    }
    expect(addTracker(doc, { ...stress, options: [first, first] })).toBe(doc);
    expect(addTracker(doc, { ...stress, view: "board" })).toBe(doc);
  });
});

describe("updateTracker", () => {
  it("changes title, icon and view", () => {
    const doc = updateTracker(documentWith("weather"), WEATHER, {
      title: " Wetter 2026 ",
      icon: "🌦️",
      view: "year-dots",
    });
    expect(doc.trackers[0]).toMatchObject({ title: "Wetter 2026", icon: "🌦️", view: "year-dots" });
  });

  it("ignores a blank title and a view that does not fit", () => {
    const doc = documentWith("weather");
    expect(updateTracker(doc, WEATHER, { title: "  " })).toBe(doc);
    expect(updateTracker(doc, WEATHER, { view: "list" })).toBe(doc);
    expect(updateTracker(doc, WEATHER, { view: "board" })).toBe(doc);
  });

  it("returns the same document for an unknown id or no change", () => {
    const doc = documentWith("weather");
    expect(updateTracker(doc, "trk_nope", { title: "x" })).toBe(doc);
    expect(updateTracker(doc, WEATHER, { title: "Wetter" })).toBe(doc);
  });

  it("allows an empty icon", () => {
    const doc = updateTracker(documentWith("weather"), WEATHER, { icon: "" });
    expect(doc.trackers[0]?.icon).toBe("");
  });
});

describe("deleteTracker", () => {
  it("removes the tracker, its marks and its log items, and keeps the rest", () => {
    let doc = documentWith("weather", "stress", "movies");
    doc = setChoice(doc, "2026-10-17", WEATHER, SUN);
    doc = setChoice(doc, "2026-10-17", "trk_stress", "opt_stress_1");
    doc = setChoice(doc, "2026-10-18", WEATHER, SUN);
    doc = addLogItem(doc, {
      id: "log_1",
      trackerId: "trk_movies",
      date: "2026-10-17",
      title: "Wicked",
      rating: 4,
      note: "",
    });

    const next = deleteTracker(doc, WEATHER);

    expect(next.trackers.map((tracker) => tracker.id)).toEqual(["trk_stress", "trk_movies"]);
    expect(Object.keys(next.days)).toEqual(["2026-10-17"]);
    expect(next.days["2026-10-17"]?.marks).toEqual({ trk_stress: ["opt_stress_1"] });
    expect(next.logItems).toHaveLength(1);
    expect(deleteTracker(doc, "trk_movies").logItems).toHaveLength(0);
  });

  it("keeps a day that still has a note", () => {
    let doc = setChoice(documentWith("weather"), "2026-10-17", WEATHER, SUN);
    doc = setNote(doc, "2026-10-17", "Spaziergang");
    expect(deleteTracker(doc, WEATHER).days["2026-10-17"]?.note).toBe("Spaziergang");
  });

  it("returns the same document for an unknown id", () => {
    const doc = documentWith("weather");
    expect(deleteTracker(doc, "trk_nope")).toBe(doc);
  });
});

describe("moveTracker", () => {
  it("swaps neighbors and stops at the edges", () => {
    const doc = documentWith("weather", "stress", "rating");
    expect(moveTracker(doc, "trk_stress", -1).trackers.map((t) => t.id)).toEqual([
      "trk_stress",
      WEATHER,
      "trk_rating",
    ]);
    expect(moveTracker(doc, WEATHER, -1)).toBe(doc);
    expect(moveTracker(doc, "trk_rating", 1)).toBe(doc);
    expect(moveTracker(doc, "trk_nope", 1)).toBe(doc);
  });
});

describe("options", () => {
  it("adds an option at the end and rejects duplicates and invalid ones", () => {
    const doc = documentWith("weather");
    const next = addOption(doc, WEATHER, newOption);
    expect(next.trackers[0]?.options.at(-1)).toEqual(newOption);
    expect(addOption(next, WEATHER, newOption)).toBe(next);
    expect(addOption(doc, WEATHER, { ...newOption, label: " " })).toBe(doc);
    expect(addOption(doc, WEATHER, { ...newOption, color: "#12" })).toBe(doc);
    expect(addOption(doc, "trk_nope", newOption)).toBe(doc);
  });

  it("does not add options to a log tracker", () => {
    const doc = documentWith("movies");
    expect(addOption(doc, "trk_movies", newOption)).toBe(doc);
  });

  it("recolors and renames, ignoring a blank label and a bad color", () => {
    const doc = documentWith("weather");
    const next = updateOption(doc, WEATHER, SUN, {
      label: " Heiter ",
      color: "#ffffff",
      icon: "🌞",
    });
    expect(next.trackers[0]?.options[0]).toMatchObject({
      label: "Heiter",
      color: "#ffffff",
      icon: "🌞",
    });
    expect(updateOption(doc, WEATHER, SUN, { label: "  " })).toBe(doc);
    expect(updateOption(doc, WEATHER, SUN, { color: "yellow" })).toBe(doc);
    expect(updateOption(doc, WEATHER, "opt_nope", { label: "x" })).toBe(doc);
    expect(updateOption(doc, WEATHER, SUN, { label: "Sonnig" })).toBe(doc);
  });

  it("keeps unknown fields on an option", () => {
    const doc = documentWith("weather");
    const first = doc.trackers[0]?.options[0];
    if (!first) {
      throw new Error("no option");
    }
    const withExtra = {
      ...doc,
      trackers: [{ ...doc.trackers[0]!, options: [{ ...first, future: 1 }] }],
    };
    const next = updateOption(withExtra, WEATHER, SUN, { label: "Heiter" });
    expect(next.trackers[0]?.options[0]).toMatchObject({ label: "Heiter", future: 1 });
  });

  it("changes the look of past days without touching the marks", () => {
    const logged = setChoice(documentWith("weather"), "2026-10-17", WEATHER, SUN);
    const recolored = updateOption(logged, WEATHER, SUN, { color: "#d64550" });
    expect(recolored.days).toBe(logged.days);
  });

  it("refuses to delete the last option, and keeps marks of a deleted one", () => {
    const logged = setChoice(documentWith("weather"), "2026-10-17", WEATHER, SUN);
    const next = deleteOption(logged, WEATHER, SUN);
    expect(next.trackers[0]?.options.some((option) => option.id === SUN)).toBe(false);
    expect(next.days["2026-10-17"]?.marks[WEATHER]).toEqual([SUN]);

    let single = documentWith("stress");
    for (const option of single.trackers[0]?.options ?? []) {
      single = deleteOption(single, "trk_stress", option.id);
    }
    expect(single.trackers[0]?.options).toHaveLength(1);
  });

  it("moves options up and down and stops at the edges", () => {
    const doc = documentWith("stress");
    const ids = (d: typeof doc) => d.trackers[0]?.options.map((option) => option.id);
    expect(ids(moveOption(doc, "trk_stress", "opt_stress_2", -1))?.slice(0, 2)).toEqual([
      "opt_stress_2",
      "opt_stress_1",
    ]);
    expect(moveOption(doc, "trk_stress", "opt_stress_1", -1)).toBe(doc);
    expect(moveOption(doc, "trk_stress", "opt_stress_5", 1)).toBe(doc);
  });

  it("works for habit trackers too", () => {
    const doc = toggleHabit(
      documentWith("household"),
      "2026-10-17",
      "trk_household",
      "opt_household_1",
    );
    expect(doc.days["2026-10-17"]?.marks["trk_household"]).toEqual(["opt_household_1"]);
  });
});

import { describe, expect, it } from "vitest";
import { createEmptyDocument } from "./defaults";
import { documentWith } from "./fixtures";
import { addLogItem } from "./logs";
import { applyImport, mergeDocuments } from "./merge";
import { setChoice, setNote, toggleHabit } from "./marks";
import { addOption, updateOption, updateTracker } from "./trackers";
import type { LogItem } from "./types";

const DAY = "2026-10-17";
const logItem: LogItem = {
  id: "log_1",
  trackerId: "trk_movies",
  date: DAY,
  title: "Wicked",
  rating: 4,
  note: "",
};

describe("mergeDocuments: trackers", () => {
  it("appends trackers that are new and keeps the order of the base", () => {
    const merged = mergeDocuments(documentWith("weather"), documentWith("stress", "weather"));
    expect(merged.trackers.map((tracker) => tracker.id)).toEqual(["trk_weather", "trk_stress"]);
  });

  it("takes the incoming title and view on a conflict", () => {
    const incoming = updateTracker(documentWith("weather"), "trk_weather", {
      title: "Wetter neu",
      view: "year-dots",
    });
    const merged = mergeDocuments(documentWith("weather"), incoming);
    expect(merged.trackers[0]).toMatchObject({ title: "Wetter neu", view: "year-dots" });
  });

  it("unites the legends by option id, incoming wins, nothing of the base is lost", () => {
    const base = addOption(documentWith("weather"), "trk_weather", {
      id: "opt_mine",
      label: "Meine",
      color: "#9a9a9a",
      icon: "",
      shape: "",
    });
    const incoming = updateOption(documentWith("weather"), "trk_weather", "opt_weather_1", {
      color: "#ffffff",
    });
    const options = mergeDocuments(base, incoming).trackers[0]?.options ?? [];
    expect(options.find((option) => option.id === "opt_weather_1")?.color).toBe("#ffffff");
    expect(options.some((option) => option.id === "opt_mine")).toBe(true);
    expect(options).toHaveLength(8);
  });
});

describe("mergeDocuments: days", () => {
  it("adds days the base does not have", () => {
    const incoming = setChoice(
      documentWith("weather"),
      "2026-10-01",
      "trk_weather",
      "opt_weather_1",
    );
    const base = setChoice(documentWith("weather"), "2026-10-02", "trk_weather", "opt_weather_2");
    expect(Object.keys(mergeDocuments(base, incoming).days).toSorted()).toEqual([
      "2026-10-01",
      "2026-10-02",
    ]);
  });

  it("lets an incoming pick win per tracker and keeps the other trackers of the base", () => {
    let base = documentWith("weather", "stress");
    base = setChoice(base, DAY, "trk_weather", "opt_weather_1");
    base = setChoice(base, DAY, "trk_stress", "opt_stress_1");
    const incoming = setChoice(documentWith("weather"), DAY, "trk_weather", "opt_weather_2");
    expect(mergeDocuments(base, incoming).days[DAY]?.marks).toEqual({
      trk_weather: ["opt_weather_2"],
      trk_stress: ["opt_stress_1"],
    });
  });

  it("never lets an empty incoming pick or note erase anything", () => {
    let base = setChoice(documentWith("weather"), DAY, "trk_weather", "opt_weather_1");
    base = setNote(base, DAY, "mein Text");
    const incoming = {
      ...documentWith("weather"),
      days: { [DAY]: { marks: { trk_weather: [] }, note: "" } },
    };
    const day = mergeDocuments(base, incoming).days[DAY];
    expect(day?.marks).toEqual({ trk_weather: ["opt_weather_1"] });
    expect(day?.note).toBe("mein Text");
  });

  it("takes a non-empty incoming note", () => {
    const base = setNote(documentWith("weather"), DAY, "alt");
    const incoming = setNote(documentWith("weather"), DAY, "neu");
    expect(mergeDocuments(base, incoming).days[DAY]?.note).toBe("neu");
  });

  it("replaces the habits of a day with the incoming ones", () => {
    let base = toggleHabit(documentWith("household"), DAY, "trk_household", "opt_household_1");
    base = toggleHabit(base, DAY, "trk_household", "opt_household_2");
    const incoming = toggleHabit(
      documentWith("household"),
      DAY,
      "trk_household",
      "opt_household_3",
    );
    expect(mergeDocuments(base, incoming).days[DAY]?.marks["trk_household"]).toEqual([
      "opt_household_3",
    ]);
  });

  it("does not change its inputs", () => {
    const base = setChoice(documentWith("weather"), DAY, "trk_weather", "opt_weather_1");
    const incoming = setChoice(documentWith("weather"), DAY, "trk_weather", "opt_weather_2");
    const before = JSON.stringify(base);
    mergeDocuments(base, incoming);
    expect(JSON.stringify(base)).toBe(before);
  });
});

describe("mergeDocuments: log items", () => {
  it("unites by id and lets the incoming item win", () => {
    const base = addLogItem(documentWith("movies"), logItem);
    const incoming = addLogItem(documentWith("movies"), { ...logItem, rating: 2 });
    const other = addLogItem(incoming, { ...logItem, id: "log_2", title: "Anderer" });
    const merged = mergeDocuments(base, other);
    expect(merged.logItems.map((item) => [item.id, item.rating])).toEqual([
      ["log_1", 2],
      ["log_2", 4],
    ]);
  });
});

describe("applyImport", () => {
  it("replaces everything in replace mode", () => {
    const current = documentWith("weather");
    const incoming = documentWith("stress");
    expect(applyImport(current, incoming, "replace")).toBe(incoming);
  });

  it("merges in merge mode", () => {
    const merged = applyImport(documentWith("weather"), documentWith("stress"), "merge");
    expect(merged.trackers).toHaveLength(2);
  });

  it("merging into an empty document gives the incoming content", () => {
    const incoming = setChoice(documentWith("weather"), DAY, "trk_weather", "opt_weather_1");
    expect(applyImport(createEmptyDocument(), incoming, "merge")).toEqual(incoming);
  });
});

import { describe, expect, it } from "vitest";
import { createEmptyDocument } from "./defaults";
import { documentWith } from "./fixtures";
import { addLogItem, deleteLogItem, isTextTracker, logItemsOf, updateLogItem } from "./logs";
import { createTrackerFromPreset, PRESETS } from "./presets";
import { addTracker } from "./trackers";
import type { LogItem } from "./types";

const item: LogItem = {
  id: "log_1",
  trackerId: "trk_movies",
  date: "2026-10-17",
  title: "Wicked",
  rating: 4,
  note: "",
};

describe("addLogItem", () => {
  it("adds a trimmed item to a log tracker", () => {
    const doc = addLogItem(documentWith("movies"), { ...item, title: "  Wicked  " });
    expect(doc.logItems).toEqual([item]);
  });

  it("accepts a rating of 0 for unrated", () => {
    const doc = addLogItem(documentWith("movies"), { ...item, rating: 0 });
    expect(doc.logItems[0]?.rating).toBe(0);
  });

  it("rejects bad input", () => {
    const doc = documentWith("movies", "weather");
    expect(addLogItem(doc, { ...item, title: " " })).toBe(doc);
    expect(addLogItem(doc, { ...item, date: "2026-02-30" })).toBe(doc);
    expect(addLogItem(doc, { ...item, rating: 6 })).toBe(doc);
    expect(addLogItem(doc, { ...item, rating: -1 })).toBe(doc);
    expect(addLogItem(doc, { ...item, rating: 2.5 })).toBe(doc);
    expect(addLogItem(doc, { ...item, trackerId: "trk_weather" })).toBe(doc);
    expect(addLogItem(doc, { ...item, trackerId: "trk_nope" })).toBe(doc);
  });

  it("rejects a duplicate id", () => {
    const doc = addLogItem(documentWith("movies"), item);
    expect(addLogItem(doc, item)).toBe(doc);
  });
});

describe("updateLogItem", () => {
  const doc = addLogItem(documentWith("movies"), item);

  it("changes every field", () => {
    const next = updateLogItem(doc, "log_1", {
      title: " Wicked 2 ",
      date: "2026-10-20",
      rating: 5,
      note: "Noch besser",
    });
    expect(next.logItems[0]).toMatchObject({
      title: "Wicked 2",
      date: "2026-10-20",
      rating: 5,
      note: "Noch besser",
    });
  });

  it("ignores a blank title, a bad date and a bad rating", () => {
    expect(updateLogItem(doc, "log_1", { title: " " })).toBe(doc);
    expect(updateLogItem(doc, "log_1", { date: "2026-02-30" })).toBe(doc);
    expect(updateLogItem(doc, "log_1", { rating: 9 })).toBe(doc);
  });

  it("returns the same document for an unknown id or no change", () => {
    expect(updateLogItem(doc, "log_nope", { title: "x" })).toBe(doc);
    expect(updateLogItem(doc, "log_1", { title: "Wicked" })).toBe(doc);
  });
});

describe("deleteLogItem", () => {
  it("removes the item", () => {
    const doc = addLogItem(documentWith("movies"), item);
    expect(deleteLogItem(doc, "log_1").logItems).toEqual([]);
    expect(deleteLogItem(doc, "log_nope")).toBe(doc);
  });
});

describe("logItemsOf", () => {
  it("lists one tracker's items oldest first and keeps same-day order", () => {
    let doc = documentWith("movies");
    doc = addLogItem(doc, { ...item, id: "a", date: "2026-10-20", title: "C" });
    doc = addLogItem(doc, { ...item, id: "b", date: "2026-10-01", title: "A" });
    doc = addLogItem(doc, { ...item, id: "c", date: "2026-10-20", title: "D" });
    expect(logItemsOf(doc, "trk_movies").map((entry) => entry.title)).toEqual(["A", "C", "D"]);
    expect(logItemsOf(doc, "trk_nope")).toEqual([]);
  });
});

function notesDoc() {
  const preset = PRESETS.find((candidate) => candidate.key === "notes");
  if (!preset) {
    throw new Error("preset missing");
  }
  const tracker = createTrackerFromPreset(preset, (prefix) => `${prefix}_notes`);
  return { doc: addTracker(createEmptyDocument(), tracker), tracker };
}

const entry = (trackerId: string, note: string) => ({
  id: "log_1",
  trackerId,
  date: "2026-10-17",
  title: "Titel",
  rating: 4,
  note,
});

describe("notes tracker entries", () => {
  it("recognizes only the notes style as text", () => {
    const { tracker } = notesDoc();
    expect(isTextTracker(tracker)).toBe(true);
    expect(isTextTracker({ ...tracker, entries: "titled" })).toBe(false);
    expect(isTextTracker({ ...tracker, entries: undefined })).toBe(false);
  });

  it("needs a text, and drops title and stars", () => {
    const { doc, tracker } = notesDoc();
    expect(addLogItem(doc, entry(tracker.id, "  "))).toBe(doc);
    expect(addLogItem(doc, entry(tracker.id, "Regen")).logItems).toEqual([
      { ...entry(tracker.id, "Regen"), title: "", rating: 0 },
    ]);
  });

  it("changes only date and text, and never makes the text blank", () => {
    const { doc, tracker } = notesDoc();
    const added = addLogItem(doc, entry(tracker.id, "Regen"));
    expect(updateLogItem(added, "log_1", { note: " " })).toBe(added);
    expect(updateLogItem(added, "log_1", { title: "x", rating: 2 })).toBe(added);
    expect(
      updateLogItem(added, "log_1", { note: "Sonne", date: "2026-10-18" }).logItems[0],
    ).toMatchObject({ note: "Sonne", date: "2026-10-18", title: "", rating: 0 });
  });
});

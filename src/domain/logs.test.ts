import { describe, expect, it } from "vitest";
import { documentWith } from "./fixtures";
import { addLogItem, deleteLogItem, logItemsOf, updateLogItem } from "./logs";
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

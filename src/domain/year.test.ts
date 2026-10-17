import { describe, expect, it } from "vitest";
import { yearCells } from "./cells";
import { yearGrid } from "./calendar";
import { documentWith } from "./fixtures";
import { applyImport } from "./merge";
import { setChoice } from "./marks";
import { parseDocument } from "./parse";
import { optionCounts, summarize } from "./selectors";
import type { AppDocument } from "./types";

// The acceptance test for the data layer: a full year of marks survives export, import and merge.

function fullYear(year: number, optionCount: number): AppDocument {
  let doc = documentWith("weather");
  let index = 0;
  for (const cell of yearGrid(year).flat()) {
    if (cell.dateKey !== null) {
      index += 1;
      doc = setChoice(
        doc,
        cell.dateKey,
        "trk_weather",
        `opt_weather_${String((index % optionCount) + 1)}`,
      );
    }
  }
  return doc;
}

describe("a year of marks", () => {
  const doc = fullYear(2026, 7);

  it("has 365 days and one mark per day", () => {
    expect(summarize(doc)).toEqual({ days: 365, marks: 365, logItems: 0 });
    expect(doc.days["2026-02-30"]).toBeUndefined();
  });

  it("survives export and import unchanged", () => {
    const text = JSON.stringify(doc, null, 2);
    expect(parseDocument(JSON.parse(text))).toEqual({ ok: true, value: doc });
  });

  it("shows up in the grid with a cell for every real day and none for Feb 30", () => {
    const cells = yearCells(doc, "trk_weather", 2026).flat();
    expect(cells.filter((cell) => cell.status === "marked")).toHaveLength(365);
    expect(cells.filter((cell) => cell.status === "invalid")).toHaveLength(7);
    expect(cells.filter((cell) => cell.status === "empty")).toHaveLength(0);
  });

  it("adds up per option", () => {
    const total = Object.values(optionCounts(doc, "trk_weather", "2026").byOption).reduce(
      (sum, count) => sum + count,
      0,
    );
    expect(total).toBe(365);
  });

  it("merges into another year without losing either", () => {
    const merged = applyImport(doc, fullYear(2025, 3), "merge");
    expect(summarize(merged).days).toBe(730);
    expect(merged.days["2026-10-17"]).toEqual(doc.days["2026-10-17"]);
    expect(applyImport(fullYear(2025, 3), doc, "merge").days["2026-10-17"]).toEqual(
      doc.days["2026-10-17"],
    );
  });

  it("is replaced completely in replace mode", () => {
    const replaced = applyImport(fullYear(2025, 3), doc, "replace");
    expect(summarize(replaced).days).toBe(365);
  });
});

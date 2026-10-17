import { describe, expect, it } from "vitest";
import { monthCells, recentCells, yearCells } from "./cells";
import { documentWith } from "./fixtures";
import { deleteOption } from "./trackers";
import { setChoice } from "./marks";

const SUN = "opt_weather_1";

describe("yearCells", () => {
  it("is empty for an unknown tracker", () => {
    expect(yearCells(documentWith("weather"), "trk_nope", 2026)).toEqual([]);
  });

  it("marks days that do not exist as invalid and never as data", () => {
    const grid = yearCells(documentWith("weather"), "trk_weather", 2026);
    const feb30 = grid[29]?.[1];
    expect(feb30).toMatchObject({ month: 2, day: 30, dateKey: null, status: "invalid" });
    expect(grid.flat().filter((cell) => cell.status === "invalid")).toHaveLength(31 * 12 - 365);
  });

  it("shows a picked option as marked with its color", () => {
    const doc = setChoice(documentWith("weather"), "2026-10-17", "trk_weather", SUN);
    const cell = yearCells(doc, "trk_weather", 2026)[16]?.[9];
    expect(cell).toMatchObject({ dateKey: "2026-10-17", status: "marked" });
    expect(cell?.option?.color).toBe("#f6c945");
  });

  it("leaves other years, and other trackers' marks, empty", () => {
    const doc = setChoice(documentWith("weather", "stress"), "2026-10-17", "trk_weather", SUN);
    expect(yearCells(doc, "trk_weather", 2025)[16]?.[9]?.status).toBe("empty");
    expect(yearCells(doc, "trk_stress", 2026)[16]?.[9]?.status).toBe("empty");
  });

  it("shows a day whose option was deleted as unknown, not empty", () => {
    const logged = setChoice(documentWith("weather"), "2026-10-17", "trk_weather", SUN);
    const doc = deleteOption(logged, "trk_weather", SUN);
    const cell = yearCells(doc, "trk_weather", 2026)[16]?.[9];
    expect(cell).toMatchObject({ status: "unknown", option: null });
  });
});

describe("monthCells", () => {
  it("has one cell per real day", () => {
    const doc = documentWith("sleep");
    expect(monthCells(doc, "trk_sleep", 2026, 2)).toHaveLength(28);
    expect(monthCells(doc, "trk_sleep", 2028, 2)).toHaveLength(29);
    expect(monthCells(doc, "trk_sleep", 2026, 10)).toHaveLength(31);
    expect(monthCells(doc, "trk_nope", 2026, 10)).toEqual([]);
  });

  it("carries the picked option of each day in order", () => {
    const doc = setChoice(documentWith("sleep"), "2026-10-03", "trk_sleep", "opt_sleep_3");
    const cells = monthCells(doc, "trk_sleep", 2026, 10);
    expect(cells.map((cell) => cell.day).slice(0, 4)).toEqual([1, 2, 3, 4]);
    expect(cells[2]?.option?.label).toBe("6 bis 8 Stunden");
    expect(cells.filter((cell) => cell.status === "marked")).toHaveLength(1);
  });
});

describe("recentCells", () => {
  it("returns the last days oldest first, across a month boundary", () => {
    const doc = setChoice(documentWith("weather"), "2026-10-31", "trk_weather", "opt_weather_1");
    const cells = recentCells(doc, "trk_weather", "2026-11-02", 4);
    expect(cells.map((cell) => cell.dateKey)).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
    expect(cells.map((cell) => cell.status)).toEqual(["empty", "marked", "empty", "empty"]);
  });

  it("is empty for an unknown tracker or a bad date", () => {
    const doc = documentWith("weather");
    expect(recentCells(doc, "trk_nope", "2026-10-17", 3)).toEqual([]);
    expect(recentCells(doc, "trk_weather", "2026-02-30", 3)).toEqual([]);
  });
});

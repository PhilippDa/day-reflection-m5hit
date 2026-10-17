import { describe, expect, it } from "vitest";
import { daysInMonth, monthDateKeys, shiftMonth, toKey, weekdayOffset, yearGrid } from "./calendar";

describe("daysInMonth", () => {
  it("knows month lengths and leap years", () => {
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(1900, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
  });
});

describe("toKey", () => {
  it("builds keys for real days only", () => {
    expect(toKey(2026, 10, 7)).toBe("2026-10-07");
    expect(toKey(2026, 2, 30)).toBeNull();
    expect(toKey(2026, 2, 29)).toBeNull();
    expect(toKey(2028, 2, 29)).toBe("2028-02-29");
    expect(toKey(2026, 4, 31)).toBeNull();
  });
});

const realDays = (year: number) =>
  yearGrid(year)
    .flat()
    .filter((cell) => cell.dateKey !== null);

describe("yearGrid", () => {
  it("has 31 rows of 12 columns", () => {
    const grid = yearGrid(2026);
    expect(grid).toHaveLength(31);
    expect(grid.every((row) => row.length === 12)).toBe(true);
  });

  it("has exactly 365 real days in a normal year and 366 in a leap year", () => {
    expect(realDays(2026)).toHaveLength(365);
    expect(realDays(2028)).toHaveLength(366);
  });

  it("never gives Feb 30 or Apr 31 a key", () => {
    const grid = yearGrid(2026);
    expect(grid[29]?.[1]?.dateKey).toBeNull();
    expect(grid[30]?.[3]?.dateKey).toBeNull();
    expect(grid[30]?.[0]?.dateKey).toBe("2026-01-31");
  });

  it("puts months in columns and days in rows", () => {
    expect(yearGrid(2026)[16]?.[9]).toEqual({ month: 10, day: 17, dateKey: "2026-10-17" });
  });
});

describe("monthDateKeys", () => {
  it("lists a whole month in order", () => {
    const keys = monthDateKeys(2026, 2);
    expect(keys).toHaveLength(28);
    expect(keys[0]).toBe("2026-02-01");
    expect(keys.at(-1)).toBe("2026-02-28");
  });
});

describe("shiftMonth", () => {
  it("rolls over the year in both directions", () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth(2026, 10, 0)).toEqual({ year: 2026, month: 10 });
    expect(shiftMonth(2026, 3, -15)).toEqual({ year: 2024, month: 12 });
    expect(shiftMonth(2026, 3, 25)).toEqual({ year: 2028, month: 4 });
  });
});

describe("weekdayOffset", () => {
  it("counts the empty cells before the 1st, with Monday first", () => {
    expect(weekdayOffset(2026, 10)).toBe(3); // Thursday
    expect(weekdayOffset(2026, 6)).toBe(0); // Monday
    expect(weekdayOffset(2026, 2)).toBe(6); // Sunday
  });
});

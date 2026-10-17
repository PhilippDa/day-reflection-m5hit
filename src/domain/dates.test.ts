import { describe, expect, it } from "vitest";
import { addDays, isDateKey, parseDateKey, toDateKey } from "./dates";

describe("toDateKey", () => {
  it("uses the local calendar date", () => {
    expect(toDateKey(new Date(2026, 9, 17, 23, 59))).toBe("2026-10-17");
    expect(toDateKey(new Date(2026, 0, 5, 0, 0))).toBe("2026-01-05");
  });
});

describe("isDateKey", () => {
  it("accepts real dates, including leap days", () => {
    expect(isDateKey("2026-10-17")).toBe(true);
    expect(isDateKey("2028-02-29")).toBe(true);
  });

  it("rejects wrong shapes and impossible dates", () => {
    expect(isDateKey("2026-2-3")).toBe(false);
    expect(isDateKey("2026-13-01")).toBe(false);
    expect(isDateKey("2027-02-29")).toBe(false);
    expect(isDateKey("2026-10-17T10:00:00Z")).toBe(false);
    expect(isDateKey("")).toBe(false);
  });
});

describe("parseDateKey", () => {
  it("returns local midnight for valid keys and undefined otherwise", () => {
    expect(parseDateKey("2026-10-17")).toEqual(new Date(2026, 9, 17));
    expect(parseDateKey("2026-02-30")).toBeUndefined();
    expect(parseDateKey("nope")).toBeUndefined();
  });
});

describe("addDays", () => {
  it("moves across month, year and leap-day boundaries", () => {
    expect(addDays("2026-10-17", 1)).toBe("2026-10-18");
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-10-17", 0)).toBe("2026-10-17");
  });

  it("is not thrown off by daylight saving changes", () => {
    expect(addDays("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDays("2026-03-29", 1)).toBe("2026-03-30");
    expect(addDays("2026-10-24", 1)).toBe("2026-10-25");
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
  });

  it("leaves an invalid key alone", () => {
    expect(addDays("morgen", 1)).toBe("morgen");
  });
});

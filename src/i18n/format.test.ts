import { describe, expect, it } from "vitest";
import { formatDateLong, formatDateShort, formatDateTime } from "./format";

describe("format", () => {
  it("writes long and short German dates", () => {
    expect(formatDateLong("2026-10-17")).toBe("Samstag, 17. Oktober 2026");
    expect(formatDateShort("2026-10-17")).toMatch(/^Sa\.?, 17\. Okt\.? 2026$/);
  });

  it("falls back to the input when it is not a date", () => {
    expect(formatDateLong("morgen")).toBe("morgen");
    expect(formatDateShort("morgen")).toBe("morgen");
    expect(formatDateTime("irgendwann")).toBe("irgendwann");
  });

  it("writes a local date and time", () => {
    expect(formatDateTime(new Date(2026, 9, 17, 20, 5).toISOString())).toMatch(
      /17\.10\.2026.*20:05/,
    );
  });
});

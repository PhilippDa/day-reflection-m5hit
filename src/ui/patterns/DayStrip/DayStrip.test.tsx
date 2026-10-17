import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { DayStrip } from "./DayStrip";

const days = [
  { dateKey: "2026-10-01", day: 1, count: 0 },
  { dateKey: "2026-10-02", day: 2, count: 3 },
];

function strip(onSelect: (key: string) => void = () => undefined) {
  render(
    <DayStrip
      days={days}
      label="Tage"
      dayLabel={(day) => `${day.dateKey}: ${String(day.count)}`}
      onSelect={onSelect}
    />,
  );
}

describe("DayStrip", () => {
  it("has a named button per day", () => {
    strip();
    expect(screen.getByRole("region", { name: "Tage" })).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "2026-10-02: 3" })).toBeTruthy();
  });

  it("shows the count only for days with something done", () => {
    strip();
    expect(screen.getByRole("button", { name: "2026-10-02: 3" }).textContent).toBe("23");
    expect(screen.getByRole("button", { name: "2026-10-01: 0" }).textContent).toBe("1");
  });

  it("reports taps", () => {
    const onSelect = vi.fn<(key: string) => void>();
    strip(onSelect);
    fireEvent.click(screen.getByRole("button", { name: "2026-10-01: 0" }));
    expect(onSelect).toHaveBeenCalledWith("2026-10-01");
  });
});

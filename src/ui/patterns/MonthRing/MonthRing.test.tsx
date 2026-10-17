import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { monthCells } from "../../../domain/cells";
import { documentWith } from "../../../domain/fixtures";
import { setChoice } from "../../../domain/marks";
import { deleteOption } from "../../../domain/trackers";
import { MonthRing } from "./MonthRing";

function ring(year: number, month: number, onSelect: (key: string) => void = () => undefined) {
  let doc = documentWith("sleep");
  doc = setChoice(doc, "2026-10-17", "trk_sleep", "opt_sleep_3");
  doc = setChoice(doc, "2026-10-18", "trk_sleep", "opt_sleep_2");
  doc = deleteOption(doc, "trk_sleep", "opt_sleep_2");
  render(
    <MonthRing
      cells={monthCells(doc, "trk_sleep", year, month)}
      title="Oktober"
      subtitle="2026"
      label="Schlaf Oktober 2026"
      cellLabel={(cell) => `${cell.dateKey ?? ""}|${cell.status}`}
      onSelect={onSelect}
    />,
  );
}

describe("MonthRing", () => {
  it("has one button per day of the month, 31 in October and 28 in February", () => {
    ring(2026, 10);
    expect(screen.getByRole("region", { name: "Schlaf Oktober 2026" })).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(31);
  });

  it("has 28 buttons in February and 29 in a leap year", () => {
    ring(2026, 2);
    expect(screen.getAllByRole("button")).toHaveLength(28);
  });

  it("names every segment with its status", () => {
    ring(2026, 10);
    expect(screen.getByRole("button", { name: "2026-10-17|marked" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "2026-10-18|unknown" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "2026-10-01|empty" })).toBeTruthy();
  });

  it("shows the title and the day numbers", () => {
    ring(2026, 10);
    expect(screen.getByText("Oktober")).toBeTruthy();
    expect(screen.getByText("31")).toBeTruthy();
  });

  it("is reachable and operable by keyboard", () => {
    const onSelect = vi.fn<(key: string) => void>();
    ring(2026, 10, onSelect);
    const segment = screen.getByRole("button", { name: "2026-10-05|empty" });
    expect(segment.getAttribute("tabindex")).toBe("0");
    fireEvent.keyDown(segment, { key: "Enter" });
    fireEvent.keyDown(segment, { key: " " });
    fireEvent.keyDown(segment, { key: "a" });
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenCalledWith("2026-10-05");
  });

  it("reports taps and colors a marked segment from its option", () => {
    const onSelect = vi.fn<(key: string) => void>();
    ring(2026, 10, onSelect);
    const segment = screen.getByRole("button", { name: "2026-10-17|marked" });
    fireEvent.click(segment);
    expect(onSelect).toHaveBeenCalledWith("2026-10-17");
    expect(segment.getAttribute("style")).toContain("#4a90d9");
  });
});

import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { monthCells } from "../../../domain/cells";
import { documentWith } from "../../../domain/fixtures";
import { setChoice } from "../../../domain/marks";
import { MonthStamps } from "./MonthStamps";

const weekdays = ["Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa.", "So."];

function stamps(onSelect: (key: string) => void = () => undefined) {
  const doc = setChoice(documentWith("steps"), "2026-10-17", "trk_steps", "opt_steps_2");
  return render(
    <MonthStamps
      cells={monthCells(doc, "trk_steps", 2026, 10)}
      offset={3}
      weekdays={weekdays}
      label="Schritte Oktober 2026"
      cellLabel={(cell) => `${cell.dateKey ?? ""}|${cell.status}`}
      onSelect={onSelect}
    />,
  );
}

describe("MonthStamps", () => {
  it("has a button for every day and the weekday headings", () => {
    stamps();
    expect(screen.getByRole("region", { name: "Schritte Oktober 2026" })).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(31);
    expect(screen.getByText("Mo.")).toBeTruthy();
  });

  it("leaves empty cells before the 1st so the weekdays line up", () => {
    const { container } = stamps();
    const grid = container.firstElementChild;
    // 7 weekday headings, then 3 blanks, then the first day.
    expect(grid?.children[7]?.tagName).toBe("SPAN");
    expect(grid?.children[9]?.tagName).toBe("SPAN");
    expect(grid?.children[10]?.tagName).toBe("BUTTON");
  });

  it("colors a stamped day from its option and reports taps", () => {
    const onSelect = vi.fn<(key: string) => void>();
    stamps(onSelect);
    const cell = screen.getByRole("button", { name: "2026-10-17|marked" });
    expect(cell.getAttribute("style")).toContain("#d64550");
    fireEvent.click(cell);
    expect(onSelect).toHaveBeenCalledWith("2026-10-17");
  });
});

import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { yearCells } from "../../../domain/cells";
import { documentWith } from "../../../domain/fixtures";
import { setChoice } from "../../../domain/marks";
import { deleteOption } from "../../../domain/trackers";
import { YearGrid } from "./YearGrid";

const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function grid(
  onSelect: (key: string) => void = () => undefined,
  variant: "squares" | "dots" = "squares",
) {
  let doc = documentWith("weather");
  doc = setChoice(doc, "2026-10-17", "trk_weather", "opt_weather_1");
  doc = setChoice(doc, "2026-10-18", "trk_weather", "opt_weather_2");
  doc = deleteOption(doc, "trk_weather", "opt_weather_2");
  render(
    <YearGrid
      cells={yearCells(doc, "trk_weather", 2026)}
      variant={variant}
      monthLabels={months}
      label="Wetter 2026"
      cellLabel={(cell) => `${cell.dateKey ?? ""}|${cell.status}`}
      onSelect={onSelect}
    />,
  );
}

describe("YearGrid", () => {
  it("has a button for every real day of the year and none for days that do not exist", () => {
    grid();
    expect(screen.getByRole("region", { name: "Wetter 2026" })).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(365);
    expect(screen.queryByRole("button", { name: /2026-02-30/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /2026-02-29/ })).toBeNull();
  });

  it("names each cell with its status", () => {
    grid();
    expect(screen.getByRole("button", { name: "2026-10-17|marked" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "2026-10-18|unknown" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "2026-10-19|empty" })).toBeTruthy();
  });

  it("colors a marked cell from the option and reports taps", () => {
    const onSelect = vi.fn<(key: string) => void>();
    grid(onSelect);
    const cell = screen.getByRole("button", { name: "2026-10-17|marked" });
    expect(cell.style.getPropertyValue("--cell")).toBe("#f6c945");
    fireEvent.click(cell);
    expect(onSelect).toHaveBeenCalledWith("2026-10-17");
  });

  it("also draws the dots variant", () => {
    grid(() => undefined, "dots");
    expect(screen.getAllByRole("button")).toHaveLength(365);
  });
});

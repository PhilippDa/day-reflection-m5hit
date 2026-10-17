import { render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { Legend } from "./Legend";

const items = [
  { id: "a", label: "Sonnig", color: "#f6c945", icon: "sunny", count: 12 },
  { id: "b", label: "Regen", color: "#8fd0f0", icon: "", count: 0 },
];

describe("Legend", () => {
  it("lists every option with its count", () => {
    render(<Legend items={items} unknownLabel="Unbekannt" />);
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.textContent).toBe("Sonnig12");
    expect(rows[0]?.querySelectorAll("svg")).toHaveLength(1);
    expect(rows[1]?.textContent).toBe("Regen0");
    expect(rows[1]?.querySelectorAll("svg")).toHaveLength(0);
  });

  it("still shows an emoji from older data as text", () => {
    render(<Legend items={[{ ...items[0]!, icon: "🌞" }]} unknownLabel="Unbekannt" />);
    expect(screen.getByRole("listitem").textContent).toBe("🌞Sonnig12");
  });

  it("adds a line for deleted options only when days use them", () => {
    const { rerender } = render(<Legend items={items} unknownCount={3} unknownLabel="Unbekannt" />);
    expect(screen.getByText("Unbekannt")).toBeTruthy();
    rerender(<Legend items={items} unknownCount={0} unknownLabel="Unbekannt" />);
    expect(screen.queryByText("Unbekannt")).toBeNull();
  });
});

import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { ToggleGroup } from "./ToggleGroup";

const options = [
  { value: "1", label: "😞", name: "Schlecht" },
  { value: "2", label: "🙂", name: "Gut" },
];

describe("ToggleGroup", () => {
  it("is a named group of toggle buttons with the selected one pressed", () => {
    render(<ToggleGroup label="Stimmung" options={options} value="2" onChange={() => undefined} />);
    expect(screen.getByRole("group", { name: "Stimmung" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Gut" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Schlecht" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
  });

  it("selects an option, and deselects it when tapped again", () => {
    const onChange = vi.fn<(value: string | null) => void>();
    render(<ToggleGroup label="Stimmung" options={options} value="2" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Schlecht" }));
    expect(onChange).toHaveBeenLastCalledWith("1");
    fireEvent.click(screen.getByRole("button", { name: "Gut" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("uses the label as the name when no name is given", () => {
    render(
      <ToggleGroup
        label="Wahl"
        options={[{ value: "a", label: "Alpha" }]}
        value={null}
        onChange={() => undefined}
      />,
    );
    expect(screen.getByRole("button", { name: "Alpha" })).toBeTruthy();
  });
});

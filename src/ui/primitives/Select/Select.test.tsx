import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { Select } from "./Select";

const options = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];

describe("Select", () => {
  it("lists the options under its label and reports a change", () => {
    const onChange = vi.fn<(value: string) => void>();
    render(<Select label="Wahl" value="a" options={options} onChange={onChange} />);
    const select = screen.getByRole<HTMLSelectElement>("combobox", { name: "Wahl" });
    expect(select.value).toBe("a");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Alpha", "Beta"]);
    fireEvent.change(select, { target: { value: "b" } });
    expect(onChange).toHaveBeenCalledWith("b");
  });
});

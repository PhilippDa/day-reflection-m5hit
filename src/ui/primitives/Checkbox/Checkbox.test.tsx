import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("is a checkbox named by its label and reflects `checked`", () => {
    render(<Checkbox label="Haare gewaschen" checked onChange={() => undefined} />);
    expect(
      screen.getByRole<HTMLInputElement>("checkbox", { name: "Haare gewaschen" }).checked,
    ).toBe(true);
  });

  it("reports the new state when clicked", () => {
    const onChange = vi.fn<(checked: boolean) => void>();
    render(<Checkbox label="Haare gewaschen" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Haare gewaschen" }));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { DateField } from "./DateField";

describe("DateField", () => {
  it("is a date input named by its label, with a latest day", () => {
    render(
      <DateField label="Datum" value="2026-10-17" max="2026-10-20" onInput={() => undefined} />,
    );
    const input = screen.getByLabelText<HTMLInputElement>("Datum");
    expect(input.type).toBe("date");
    expect(input.value).toBe("2026-10-17");
    expect(input.max).toBe("2026-10-20");
  });

  it("reports the typed value", () => {
    const onInput = vi.fn<(value: string) => void>();
    render(<DateField label="Datum" value="" onInput={onInput} />);
    fireEvent.input(screen.getByLabelText("Datum"), { target: { value: "2026-10-01" } });
    expect(onInput).toHaveBeenCalledWith("2026-10-01");
  });
});

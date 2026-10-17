import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { TextField } from "./TextField";

describe("TextField", () => {
  it("shows the value under its label and reports typing", () => {
    const onInput = vi.fn<(value: string) => void>();
    render(<TextField label="Titel" value="Hallo" onInput={onInput} />);
    const input = screen.getByRole<HTMLInputElement>("textbox", { name: "Titel" });
    expect(input.value).toBe("Hallo");
    fireEvent.input(input, { target: { value: "Hallo Welt" } });
    expect(onInput).toHaveBeenCalledWith("Hallo Welt");
  });
});

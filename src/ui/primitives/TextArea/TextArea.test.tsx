import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { TextArea } from "./TextArea";

describe("TextArea", () => {
  it("shows the value under its label and reports typing", () => {
    const onInput = vi.fn<(value: string) => void>();
    render(<TextArea label="Notiz" value="Eins" onInput={onInput} />);
    const area = screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Notiz" });
    expect(area.value).toBe("Eins");
    fireEvent.input(area, { target: { value: "Eins\nZwei" } });
    expect(onInput).toHaveBeenCalledWith("Eins\nZwei");
  });
});

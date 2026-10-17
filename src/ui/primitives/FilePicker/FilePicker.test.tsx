import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { FilePicker } from "./FilePicker";

describe("FilePicker", () => {
  it("opens the hidden file input from the visible button", () => {
    render(<FilePicker label="Datei wählen" accept="application/json" onPick={() => undefined} />);
    const input = screen.getByTestId<HTMLInputElement>("file-input");
    const click = vi.spyOn(input, "click");
    fireEvent.click(screen.getByRole("button", { name: "Datei wählen" }));
    expect(click).toHaveBeenCalledOnce();
    expect(input.accept).toBe("application/json");
  });

  it("reports the chosen file", () => {
    const onPick = vi.fn<(file: File) => void>();
    render(<FilePicker label="Datei wählen" accept="application/json" onPick={onPick} />);
    const file = new File(["{}"], "backup.json", { type: "application/json" });
    fireEvent.change(screen.getByTestId("file-input"), { target: { files: [file] } });
    expect(onPick).toHaveBeenCalledWith(file);
  });
});

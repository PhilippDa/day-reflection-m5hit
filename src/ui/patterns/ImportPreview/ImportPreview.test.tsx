import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { ImportPreview } from "./ImportPreview";

function setup(days = 12, marks = 40, logItems = 3) {
  const handlers = {
    onMerge: vi.fn<() => void>(),
    onReplace: vi.fn<() => void>(),
    onCancel: vi.fn<() => void>(),
  };
  render(<ImportPreview days={days} marks={marks} logItems={logItems} {...handlers} />);
  return handlers;
}

describe("ImportPreview", () => {
  it("says what the file contains", () => {
    setup();
    expect(screen.getByText("12 Tage mit 40 Markierungen und 3 Listeneinträgen.")).toBeTruthy();
  });

  it("uses the singular", () => {
    setup(1, 1, 1);
    expect(screen.getByText("1 Tag mit 1 Markierung und 1 Listeneintrag.")).toBeTruthy();
  });

  it("offers merge, replace and cancel", () => {
    const { onMerge, onReplace, onCancel } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Zusammenführen" }));
    fireEvent.click(screen.getByRole("button", { name: "Ersetzen" }));
    fireEvent.click(screen.getByRole("button", { name: "Abbrechen" }));
    expect(onMerge).toHaveBeenCalledOnce();
    expect(onReplace).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

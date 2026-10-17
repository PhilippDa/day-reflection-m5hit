import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { BottomSheet } from "./BottomSheet";

function sheet(onClose: () => void) {
  render(
    <BottomSheet title="17. Oktober" closeLabel="Fertig" onClose={onClose}>
      <button type="button">Sonnig</button>
    </BottomSheet>,
  );
}

describe("BottomSheet", () => {
  it("is a dialog named by its title and holds its content", () => {
    sheet(() => undefined);
    const dialog = screen.getByRole("dialog", { name: "17. Oktober" });
    expect(dialog.contains(screen.getByRole("button", { name: "Sonnig" }))).toBe(true);
  });

  it("moves the focus into the sheet", () => {
    sheet(() => undefined);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Fertig" }));
  });

  it("closes with the button and with Escape", () => {
    const onClose = vi.fn<() => void>();
    sheet(onClose);
    fireEvent.click(screen.getByRole("button", { name: "Fertig" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

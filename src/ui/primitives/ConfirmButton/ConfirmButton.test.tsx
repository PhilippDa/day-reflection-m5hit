import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { ConfirmButton } from "./ConfirmButton";

function setup(onConfirm: () => void = () => undefined, disabled = false) {
  render(
    <ConfirmButton
      label="Löschen"
      confirmLabel="Wirklich löschen"
      cancelLabel="Abbrechen"
      onConfirm={onConfirm}
      disabled={disabled}
    />,
  );
}

describe("ConfirmButton", () => {
  it("needs a second tap before it confirms", () => {
    const onConfirm = vi.fn<() => void>();
    setup(onConfirm);
    fireEvent.click(screen.getByRole("button", { name: "Löschen" }));
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Wirklich löschen" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("can be cancelled", () => {
    const onConfirm = vi.fn<() => void>();
    setup(onConfirm);
    fireEvent.click(screen.getByRole("button", { name: "Löschen" }));
    fireEvent.click(screen.getByRole("button", { name: "Abbrechen" }));
    expect(screen.getByRole("button", { name: "Löschen" })).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("cannot start when disabled", () => {
    setup(undefined, true);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Löschen" }).disabled).toBe(true);
  });
});

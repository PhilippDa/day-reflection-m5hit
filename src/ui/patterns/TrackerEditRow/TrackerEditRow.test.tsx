import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { TrackerEditRow } from "./TrackerEditRow";

function row(overrides: { canMoveUp?: boolean; canMoveDown?: boolean } = {}) {
  const onEdit = vi.fn<() => void>();
  const onMove = vi.fn<(delta: number) => void>();
  render(
    <TrackerEditRow
      title="Wetter"
      icon="🌤️"
      editLabel="Bearbeiten: Wetter"
      upLabel="Wetter nach oben"
      downLabel="Wetter nach unten"
      canMoveUp={overrides.canMoveUp ?? true}
      canMoveDown={overrides.canMoveDown ?? true}
      onEdit={onEdit}
      onMove={onMove}
    />,
  );
  return { onEdit, onMove };
}

describe("TrackerEditRow", () => {
  it("opens the tracker", () => {
    const { onEdit } = row();
    fireEvent.click(screen.getByRole("button", { name: "Bearbeiten: Wetter" }));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("moves it up and down with named buttons", () => {
    const { onMove } = row();
    fireEvent.click(screen.getByRole("button", { name: "Wetter nach oben" }));
    fireEvent.click(screen.getByRole("button", { name: "Wetter nach unten" }));
    expect(onMove).toHaveBeenNthCalledWith(1, -1);
    expect(onMove).toHaveBeenNthCalledWith(2, 1);
  });

  it("disables the arrow that has nowhere to go", () => {
    row({ canMoveUp: false });
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Wetter nach oben" }).disabled,
    ).toBe(true);
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Wetter nach unten" }).disabled,
    ).toBe(false);
  });
});

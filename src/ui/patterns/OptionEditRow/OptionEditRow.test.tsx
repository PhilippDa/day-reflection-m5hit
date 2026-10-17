import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import type { Option } from "../../../domain/types";
import { OptionEditRow, type OptionEditRowProps } from "./OptionEditRow";

const option: Option = { id: "o1", label: "Sonnig", color: "#f6c945", icon: "☀️", shape: "" };

function row(overrides: Partial<OptionEditRowProps> = {}) {
  const handlers = {
    onChange: vi.fn<OptionEditRowProps["onChange"]>(),
    onMove: vi.fn<OptionEditRowProps["onMove"]>(),
    onDelete: vi.fn<() => void>(),
  };
  render(
    <OptionEditRow
      option={option}
      usedOnDays={0}
      canDelete
      canMoveUp
      canMoveDown
      {...handlers}
      {...overrides}
    />,
  );
  return handlers;
}

describe("OptionEditRow", () => {
  it("edits label, emoji and color", () => {
    const { onChange } = row();
    fireEvent.input(screen.getByLabelText("Bezeichnung"), { target: { value: "Heiter" } });
    fireEvent.input(screen.getByLabelText("Symbol"), { target: { value: "🌞" } });
    fireEvent.click(screen.getByRole("button", { name: "Rot" }));
    expect(onChange).toHaveBeenCalledWith({ label: "Heiter" });
    expect(onChange).toHaveBeenCalledWith({ icon: "🌞" });
    expect(onChange).toHaveBeenCalledWith({ color: "#d64550" });
  });

  it("moves up and down", () => {
    const { onMove } = row();
    fireEvent.click(screen.getByRole("button", { name: /Nach oben/ }));
    fireEvent.click(screen.getByRole("button", { name: /Nach unten/ }));
    expect(onMove).toHaveBeenNthCalledWith(1, -1);
    expect(onMove).toHaveBeenNthCalledWith(2, 1);
  });

  it("disables moves at the edges", () => {
    row({ canMoveUp: false, canMoveDown: false });
    expect(screen.getByRole<HTMLButtonElement>("button", { name: /Nach oben/ }).disabled).toBe(
      true,
    );
    expect(screen.getByRole<HTMLButtonElement>("button", { name: /Nach unten/ }).disabled).toBe(
      true,
    );
  });

  it("deletes only after a second tap", () => {
    const { onDelete } = row();
    fireEvent.click(screen.getByRole("button", { name: "Option löschen" }));
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Wirklich löschen" }));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("warns how many days use the option", () => {
    row({ usedOnDays: 3 });
    expect(screen.getByText(/Wird an 3 Tagen verwendet/)).toBeTruthy();
  });

  it("uses the singular for one day, and says nothing for an unused option", () => {
    const { unmount } = render(
      <OptionEditRow
        option={option}
        usedOnDays={1}
        canDelete
        canMoveUp
        canMoveDown
        onChange={() => undefined}
        onMove={() => undefined}
        onDelete={() => undefined}
      />,
    );
    expect(screen.getByText(/Wird an 1 Tag verwendet/)).toBeTruthy();
    unmount();
    row();
    expect(screen.queryByText(/verwendet/)).toBeNull();
  });

  it("explains why the last option cannot be deleted", () => {
    row({ canDelete: false });
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Option löschen" }).disabled).toBe(
      true,
    );
    expect(screen.getByText("Die letzte Option kann nicht gelöscht werden.")).toBeTruthy();
  });

  it("offers a block shape only for habits", () => {
    const { onChange } = row({ showShape: true });
    fireEvent.change(screen.getByLabelText("Form"), { target: { value: "t" } });
    expect(onChange).toHaveBeenCalledWith({ shape: "t" });
  });

  it("has no shape field for other trackers", () => {
    row();
    expect(screen.queryByLabelText("Form")).toBeNull();
  });
});

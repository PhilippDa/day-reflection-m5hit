import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { LogItemForm, type LogItemValues } from "./LogItemForm";

const values: LogItemValues = { title: "Wicked", date: "2026-10-17", rating: 3, note: "" };

function form(overrides: Partial<Parameters<typeof LogItemForm>[0]> = {}) {
  const onChange = vi.fn<(patch: Partial<LogItemValues>) => void>();
  const onSave = vi.fn<() => void>();
  render(
    <LogItemForm
      values={values}
      maxDate="2026-10-20"
      canSave
      onChange={onChange}
      onSave={onSave}
      {...overrides}
    />,
  );
  return { onChange, onSave };
}

describe("LogItemForm", () => {
  it("shows the values in labelled fields", () => {
    form();
    expect(screen.getByLabelText<HTMLInputElement>("Titel").value).toBe("Wicked");
    expect(screen.getByLabelText<HTMLInputElement>("Datum").value).toBe("2026-10-17");
    expect(screen.getByRole("button", { name: "3 Sterne" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("reports changes as patches", () => {
    const { onChange } = form();
    fireEvent.input(screen.getByLabelText("Titel"), { target: { value: "Wicked 2" } });
    fireEvent.click(screen.getByRole("button", { name: "5 Sterne" }));
    fireEvent.input(screen.getByLabelText("Notiz"), { target: { value: "gut" } });
    expect(onChange).toHaveBeenCalledWith({ title: "Wicked 2" });
    expect(onChange).toHaveBeenCalledWith({ rating: 5 });
    expect(onChange).toHaveBeenCalledWith({ note: "gut" });
  });

  it("saves on submit, but not while it cannot be saved", () => {
    const first = form();
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));
    expect(first.onSave).toHaveBeenCalledOnce();
  });

  it("disables saving when it cannot be saved", () => {
    const { onSave } = form({ canSave: false });
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Speichern" }).disabled).toBe(
      true,
    );
    const button = screen.getByRole("button", { name: "Speichern" });
    const formElement = button.closest("form");
    if (!formElement) {
      throw new Error("form missing");
    }
    fireEvent.submit(formElement);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("offers deleting, with a second tap, only for existing items", () => {
    const onDelete = vi.fn<() => void>();
    form({ onDelete });
    fireEvent.click(screen.getByRole("button", { name: "Löschen" }));
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Wirklich löschen" }));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("has no delete button for a new item", () => {
    form();
    expect(screen.queryByRole("button", { name: "Löschen" })).toBeNull();
  });
});

import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { PresetRow } from "./PresetRow";

const base = {
  title: "Periode",
  icon: "🩸",
  description: "Zyklus im Blick behalten",
  kindLabel: "Eine Auswahl pro Tag",
};

describe("PresetRow", () => {
  it("is a checkbox that reports the new state", () => {
    const onChange = vi.fn<(checked: boolean) => void>();
    render(<PresetRow {...base} checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Periode/ }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("names the kind and, for health data, says so", () => {
    render(
      <PresetRow {...base} sensitiveLabel="Gesundheitsdaten" checked onChange={() => undefined} />,
    );
    expect(screen.getByText("Eine Auswahl pro Tag · Gesundheitsdaten")).toBeTruthy();
    expect(screen.getByRole<HTMLInputElement>("checkbox").checked).toBe(true);
  });
});

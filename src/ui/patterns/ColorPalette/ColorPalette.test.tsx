import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { ColorPalette } from "./ColorPalette";

const names: Record<string, string> = { "#f6c945": "Gelb", "#d64550": "Rot" };
const colorName = (color: string) => names[color] ?? "Eigene Farbe";

function palette(value: string, onChange: (color: string) => void = () => undefined) {
  render(
    <ColorPalette
      label="Farbe"
      colors={["#f6c945", "#d64550"]}
      value={value}
      colorName={colorName}
      onChange={onChange}
    />,
  );
}

describe("ColorPalette", () => {
  it("is a group of named toggle buttons with the current color pressed", () => {
    palette("#d64550");
    expect(screen.getByRole("group", { name: "Farbe" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Rot" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Gelb" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("reports the picked color", () => {
    const onChange = vi.fn<(color: string) => void>();
    palette("#d64550", onChange);
    fireEvent.click(screen.getByRole("button", { name: "Gelb" }));
    expect(onChange).toHaveBeenCalledWith("#f6c945");
  });

  it("shows a color from outside the palette as an extra selected swatch", () => {
    palette("#123456");
    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Eigene Farbe" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });
});

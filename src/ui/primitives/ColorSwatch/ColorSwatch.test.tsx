import { render } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { ColorSwatch } from "./ColorSwatch";

describe("ColorSwatch", () => {
  it("carries the color as a custom property and is hidden from screen readers", () => {
    const { container } = render(<ColorSwatch color="#f6c945" />);
    const swatch = container.firstElementChild;
    expect(swatch?.getAttribute("aria-hidden")).toBe("true");
    expect(swatch instanceof HTMLElement && swatch.style.getPropertyValue("--swatch")).toBe(
      "#f6c945",
    );
  });
});

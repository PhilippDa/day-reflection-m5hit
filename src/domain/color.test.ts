import { describe, expect, it } from "vitest";
import { MARKER_COLORS } from "./palette";
import { readableInk } from "./color";

function luminance(hex: string): number {
  const channel = (offset: number) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.039_28 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

describe("readableInk", () => {
  it("uses dark text on light colors and white text on dark ones", () => {
    expect(readableInk("#ffffff")).toBe("#000000");
    expect(readableInk("#f6c945")).toBe("#000000");
    expect(readableInk("#000000")).toBe("#ffffff");
    expect(readableInk("#4b4fa3")).toBe("#ffffff");
    expect(readableInk("#8e2c48")).toBe("#ffffff");
  });

  it("gives every palette color a contrast of at least 4.5 to 1", () => {
    for (const color of MARKER_COLORS) {
      const ink = readableInk(color);
      const [light, dark] = [
        Math.max(luminance(color), luminance(ink)),
        Math.min(luminance(color), luminance(ink)),
      ];
      expect((light + 0.05) / (dark + 0.05), `${color} with ${ink}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

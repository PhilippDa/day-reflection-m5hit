import { render } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { SHAPE_IDS } from "../../../domain/schema";
import { ShapeIcon } from "./ShapeIcon";

describe("ShapeIcon", () => {
  it("is hidden from screen readers and carries the color", () => {
    const { container } = render(<ShapeIcon shape="t" color="#8e2c48" />);
    const icon = container.firstElementChild;
    expect(icon?.getAttribute("aria-hidden")).toBe("true");
    expect(icon?.getAttribute("style")).toContain("#8e2c48");
  });

  it("draws one square per cell of the shape", () => {
    const counts = SHAPE_IDS.map((shape) => {
      const { container, unmount } = render(<ShapeIcon shape={shape} color="#ffffff" />);
      const count = container.querySelectorAll("rect").length;
      unmount();
      return count;
    });
    expect(counts).toEqual([1, 2, 4, 4, 4, 4, 4, 4, 4]);
  });
});

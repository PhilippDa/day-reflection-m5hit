import { render } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { ICON_NAMES } from "../../domain/icons";
import { Icon } from "./Icon";
import { ICON_PATHS } from "./paths";

describe("ICON_PATHS", () => {
  it("has a drawing for every icon in the catalogue and for the interface", () => {
    for (const name of [...ICON_NAMES, "chevron_left", "chevron_right", "check", "star_fill"]) {
      const path = ICON_PATHS[name] ?? "";
      expect(path.length).toBeGreaterThan(20);
      // Drawn on the 960 grid that starts at y = -960, so some coordinate is far below zero.
      expect(path).toMatch(/-[1-9]\d\d/);
    }
  });
});

describe("Icon", () => {
  it("draws a known name as a hidden svg", () => {
    const { container } = render(<Icon name="sunny" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.querySelector("path")?.getAttribute("d")).toBe(ICON_PATHS["sunny"]);
  });

  it("shows anything else, such as an old emoji, as hidden text", () => {
    const { container } = render(<Icon name="🌞" />);
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector("span")?.textContent).toBe("🌞");
    expect(container.querySelector("span")?.getAttribute("aria-hidden")).toBe("true");
  });
});

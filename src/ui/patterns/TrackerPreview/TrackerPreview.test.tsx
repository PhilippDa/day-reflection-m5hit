import { render } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { recentCells } from "../../../domain/cells";
import { documentWith } from "../../../domain/fixtures";
import { setChoice } from "../../../domain/marks";
import { TrackerPreview } from "./TrackerPreview";

describe("TrackerPreview", () => {
  it("draws one hidden square per day and colors the marked ones", () => {
    const doc = setChoice(documentWith("weather"), "2026-10-17", "trk_weather", "opt_weather_1");
    const { container } = render(
      <TrackerPreview cells={recentCells(doc, "trk_weather", "2026-10-17", 7)} />,
    );
    const root = container.firstElementChild;
    expect(root?.getAttribute("aria-hidden")).toBe("true");
    const squares = [...(root?.children ?? [])].filter((node) => node instanceof HTMLElement);
    expect(squares).toHaveLength(7);
    expect(squares.at(-1)?.style.getPropertyValue("--cell")).toBe("#f6c945");
    expect(squares[0]?.style.getPropertyValue("--cell")).toBe("");
  });
});

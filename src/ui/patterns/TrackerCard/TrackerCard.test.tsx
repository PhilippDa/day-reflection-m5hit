import { render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { TrackerCard } from "./TrackerCard";

describe("TrackerCard", () => {
  it("is a region named by the tracker title and holds its content", () => {
    render(
      <TrackerCard title="Wetter" icon="🌤️">
        <button type="button">Sonnig</button>
      </TrackerCard>,
    );
    const region = screen.getByRole("region", { name: /Wetter/ });
    expect(region.contains(screen.getByRole("button", { name: "Sonnig" }))).toBe(true);
  });

  it("shows a badge only when given one", () => {
    const { rerender } = render(
      <TrackerCard title="Wetter" icon="🌤️" badge="Offen">
        x
      </TrackerCard>,
    );
    expect(screen.getByText("Offen")).toBeTruthy();
    rerender(
      <TrackerCard title="Wetter" icon="🌤️">
        x
      </TrackerCard>,
    );
    expect(screen.queryByText("Offen")).toBeNull();
  });
});

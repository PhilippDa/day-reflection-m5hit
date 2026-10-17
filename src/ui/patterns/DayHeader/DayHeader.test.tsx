import { render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { DayHeader } from "./DayHeader";

describe("DayHeader", () => {
  it("shows the title as the page heading and the subtitle", () => {
    render(<DayHeader title="Heute" subtitle="Samstag, 17. Oktober 2026" />);
    expect(screen.getByRole("heading", { level: 1, name: "Heute" })).toBeTruthy();
    expect(screen.getByText("Samstag, 17. Oktober 2026")).toBeTruthy();
  });
});

describe("DayHeader without a subtitle", () => {
  it("shows only the heading", () => {
    render(<DayHeader title="Rückblick" />);
    expect(screen.getByRole("heading", { level: 1, name: "Rückblick" })).toBeTruthy();
    expect(document.querySelector("p")).toBeNull();
  });
});

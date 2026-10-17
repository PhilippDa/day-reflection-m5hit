import { describe, expect, it } from "vitest";
import { introDuration, introStep, introVars } from "./intro";

describe("introStep", () => {
  it("is 0 without cells", () => {
    expect(introStep(0)).toBe(0);
  });

  it("caps the step so a few cells do not crawl", () => {
    expect(introStep(3)).toBe(40);
  });

  it("shrinks the step so the sequence stays about one second", () => {
    expect(introStep(100)).toBe(10);
    expect(introStep(365)).toBeCloseTo(2.74, 2);
  });
});

describe("introDuration", () => {
  it("never takes much longer than a second", () => {
    for (const count of [1, 5, 25, 100, 365, 1000]) {
      expect(introDuration(count)).toBeLessThanOrEqual(1300);
      expect(introDuration(count)).toBeGreaterThanOrEqual(300);
    }
  });
});

describe("introVars", () => {
  it("gives the step as a CSS value", () => {
    expect(introVars(100)).toEqual({ "--step": "10ms" });
  });
});

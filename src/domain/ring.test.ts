import { describe, expect, it } from "vitest";
import { pointOnCircle, ringSegments, type RingOptions } from "./ring";

const options: RingOptions = {
  centerX: 100,
  centerY: 100,
  innerRadius: 40,
  outerRadius: 90,
  gapDegrees: 2,
};

describe("pointOnCircle", () => {
  it("starts at the top and goes clockwise", () => {
    expect(pointOnCircle(100, 100, 50, 0)).toEqual({ x: 100, y: 50 });
    expect(pointOnCircle(100, 100, 50, 90)).toEqual({ x: 150, y: 100 });
    expect(pointOnCircle(100, 100, 50, 180)).toEqual({ x: 100, y: 150 });
    expect(pointOnCircle(100, 100, 50, 270)).toEqual({ x: 50, y: 100 });
  });
});

describe("ringSegments", () => {
  it("has one segment per day, and none for an empty month", () => {
    expect(ringSegments(31, options)).toHaveLength(31);
    expect(ringSegments(28, options)).toHaveLength(28);
    expect(ringSegments(0, options)).toEqual([]);
  });

  it("puts day 1 right after the top and the last day right before it", () => {
    const segments = ringSegments(30, options);
    expect(segments[0]?.startDegrees).toBeCloseTo(1, 5);
    expect(segments.at(-1)?.endDegrees).toBeCloseTo(359, 5);
  });

  it("keeps every segment inside the ring, in order, with a gap and no overlap", () => {
    for (const count of [28, 29, 30, 31]) {
      const segments = ringSegments(count, options);
      for (const [index, segment] of segments.entries()) {
        expect(segment.endDegrees).toBeGreaterThan(segment.startDegrees);
        const next = segments[(index + 1) % count];
        const turn = index === count - 1 ? 360 : 0;
        expect(next?.startDegrees ?? Number.NaN).toBeCloseTo(segment.endDegrees + 2 - turn, 5);
        const distance = Math.hypot(segment.labelX - 100, segment.labelY - 100);
        expect(distance).toBeCloseTo(65, 0);
      }
    }
  });

  it("covers equal angles for every segment", () => {
    const widths = ringSegments(31, options).map((s) => s.endDegrees - s.startDegrees);
    for (const width of widths) {
      expect(width).toBeCloseTo(360 / 31 - 2, 5);
    }
  });

  it("builds a closed path with finite numbers only", () => {
    for (const segment of ringSegments(31, options)) {
      expect(segment.path).toMatch(/^M .+ A .+ L .+ A .+ Z$/);
      const numbers = segment.path.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
      expect(numbers.length).toBeGreaterThan(10);
      expect(numbers.every(Number.isFinite)).toBe(true);
    }
  });

  it("uses the large-arc flag only for sectors wider than half a circle", () => {
    expect(ringSegments(31, options)[0]?.path).toContain("0 0 1");
    expect(ringSegments(1, options)[0]?.path).toContain("0 1 1");
  });

  it("is deterministic", () => {
    expect(ringSegments(31, options)).toEqual(ringSegments(31, options));
  });

  it("puts the label of day 1 near the top right and of day 16 near the bottom", () => {
    const segments = ringSegments(30, options);
    const first = segments[0];
    const middle = segments[15];
    expect(first && first.labelX).toBeGreaterThan(100);
    expect(first && first.labelY).toBeLessThan(60);
    expect(middle && middle.labelY).toBeGreaterThan(150);
  });
});

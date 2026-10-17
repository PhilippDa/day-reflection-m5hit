// Geometry of the month ring: one ring segment per day, day 1 at the top, going clockwise.
// Pure functions only, so the arc math can be tested without a browser.

export interface RingOptions {
  readonly centerX: number;
  readonly centerY: number;
  readonly innerRadius: number;
  readonly outerRadius: number;
  /** Space between neighboring segments, in degrees. */
  readonly gapDegrees: number;
}

export interface RingSegment {
  /** 0-based position, so the day is `index + 1`. */
  readonly index: number;
  /** Start and end angle in degrees, clockwise from the top, gap already taken off. */
  readonly startDegrees: number;
  readonly endDegrees: number;
  /** SVG path of the ring sector. */
  readonly path: string;
  /** Where to put the day number: the middle of the sector. */
  readonly labelX: number;
  readonly labelY: number;
}

interface Point {
  readonly x: number;
  readonly y: number;
}

const round = (value: number): number => Math.round(value * 100) / 100;

/** A point on a circle. 0 degrees is the top, angles grow clockwise. */
export function pointOnCircle(
  centerX: number,
  centerY: number,
  radius: number,
  degrees: number,
): Point {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: round(centerX + radius * Math.sin(radians)),
    y: round(centerY - radius * Math.cos(radians)),
  };
}

/** The segments of a ring with `count` equal parts. Empty for a count below 1. */
export function ringSegments(count: number, options: RingOptions): RingSegment[] {
  if (count < 1) {
    return [];
  }
  const { centerX, centerY, innerRadius, outerRadius, gapDegrees } = options;
  const step = 360 / count;
  // A single segment would close into a full circle, which an arc cannot draw: keep a gap.
  const gap = Math.min(gapDegrees, step / 2);
  const middleRadius = (innerRadius + outerRadius) / 2;
  return Array.from({ length: count }, (_unused, index) => {
    const startDegrees = index * step + gap / 2;
    const endDegrees = (index + 1) * step - gap / 2;
    const largeArc = endDegrees - startDegrees > 180 ? 1 : 0;
    const outerStart = pointOnCircle(centerX, centerY, outerRadius, startDegrees);
    const outerEnd = pointOnCircle(centerX, centerY, outerRadius, endDegrees);
    const innerEnd = pointOnCircle(centerX, centerY, innerRadius, endDegrees);
    const innerStart = pointOnCircle(centerX, centerY, innerRadius, startDegrees);
    const path = [
      `M ${String(outerStart.x)} ${String(outerStart.y)}`,
      `A ${String(outerRadius)} ${String(outerRadius)} 0 ${String(largeArc)} 1 ${String(outerEnd.x)} ${String(outerEnd.y)}`,
      `L ${String(innerEnd.x)} ${String(innerEnd.y)}`,
      `A ${String(innerRadius)} ${String(innerRadius)} 0 ${String(largeArc)} 0 ${String(innerStart.x)} ${String(innerStart.y)}`,
      "Z",
    ].join(" ");
    const label = pointOnCircle(centerX, centerY, middleRadius, (startDegrees + endDegrees) / 2);
    return { index, startDegrees, endDegrees, path, labelX: label.x, labelY: label.y };
  });
}

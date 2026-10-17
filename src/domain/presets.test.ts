import { describe, expect, it } from "vitest";
import * as v from "valibot";
import { MARKER_COLORS } from "./palette";
import { createTrackerFromPreset, PRESETS } from "./presets";
import { trackerSchema } from "./schema";

let counter = 0;
const newId = (prefix: string) => `${prefix}_${String((counter += 1))}`;

describe("presets", () => {
  it("have unique keys", () => {
    expect(new Set(PRESETS.map((preset) => preset.key)).size).toBe(PRESETS.length);
  });

  it.each(PRESETS.map((preset) => [preset.key, preset] as const))(
    "%s makes a valid tracker",
    (_key, preset) => {
      const tracker = createTrackerFromPreset(preset, newId);
      expect(v.safeParse(trackerSchema, tracker).success).toBe(true);
      expect(new Set(tracker.options.map((option) => option.id)).size).toBe(tracker.options.length);
      expect(tracker.options.length > 0).toBe(tracker.kind !== "log");
    },
  );

  it("only use palette colors", () => {
    const palette = new Set<string>(MARKER_COLORS);
    for (const preset of PRESETS) {
      for (const option of preset.options) {
        expect(palette.has(option.color), `${preset.key}: ${option.label}`).toBe(true);
      }
    }
  });

  it("give every habit its own shape", () => {
    const board = PRESETS.filter((preset) => preset.kind === "habits");
    for (const preset of board) {
      const shapes = preset.options.map((option) => option.shape);
      expect(shapes.every((shape) => shape !== undefined)).toBe(true);
      expect(new Set(shapes).size).toBe(shapes.length);
    }
  });

  it("gets fresh ids every time, so adding twice cannot collide", () => {
    const preset = PRESETS[0];
    if (!preset) {
      throw new Error("no presets");
    }
    const first = createTrackerFromPreset(preset, newId);
    const second = createTrackerFromPreset(preset, newId);
    expect(first.id).not.toBe(second.id);
    expect(first.options[0]?.id).not.toBe(second.options[0]?.id);
  });

  it("marks only the period tracker as sensitive", () => {
    expect(PRESETS.filter((preset) => preset.sensitive).map((preset) => preset.key)).toEqual([
      "period",
    ]);
  });
});

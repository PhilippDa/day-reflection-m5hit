import { describe, expect, it } from "vitest";
import { createEmptyDocument } from "./defaults";
import { documentWith } from "./fixtures";
import { ICON_NAMES, isIconName, LEGACY_EMOJI, modernizeIcons } from "./icons";
import { PRESETS } from "./presets";
import { addTracker, updateOption, updateTracker } from "./trackers";

describe("ICON_NAMES", () => {
  it("has no duplicates", () => {
    expect(new Set(ICON_NAMES).size).toBe(ICON_NAMES.length);
  });

  it("recognizes only its own names", () => {
    expect(isIconName("sunny")).toBe(true);
    expect(isIconName("🌞")).toBe(false);
    expect(isIconName("")).toBe(false);
  });
});

describe("presets", () => {
  it("only use icons from the catalogue", () => {
    for (const preset of PRESETS) {
      expect(isIconName(preset.icon)).toBe(true);
      for (const option of preset.options) {
        expect(option.icon === undefined || isIconName(option.icon)).toBe(true);
      }
    }
  });
});

describe("LEGACY_EMOJI", () => {
  it("maps every old emoji to a catalogue icon", () => {
    for (const name of Object.values(LEGACY_EMOJI)) {
      expect(isIconName(name)).toBe(true);
    }
  });
});

describe("modernizeIcons", () => {
  it("returns the same document when there is nothing to change", () => {
    const doc = documentWith("weather", "stress");
    expect(modernizeIcons(doc)).toBe(doc);
    const empty = createEmptyDocument();
    expect(modernizeIcons(empty)).toBe(empty);
  });

  it("swaps old starter emoji on trackers and options, and nothing else", () => {
    let doc = documentWith("weather");
    doc = updateTracker(doc, "trk_weather", { icon: "🌤️" });
    doc = updateOption(doc, "trk_weather", "opt_weather_1", { icon: "☀️" });
    doc = updateOption(doc, "trk_weather", "opt_weather_2", { icon: "🌞" });
    const next = modernizeIcons(doc);
    const tracker = next.trackers[0];
    expect(tracker?.icon).toBe("partly_cloudy_day");
    expect(tracker?.options[0]?.icon).toBe("sunny");
    // An emoji the user typed has no icon and stays.
    expect(tracker?.options[1]?.icon).toBe("🌞");
    expect(tracker?.options[2]).toBe(doc.trackers[0]?.options[2]);
    expect(modernizeIcons(next)).toBe(next);
  });

  it("keeps trackers that need no change as the same objects", () => {
    const base = documentWith("stress");
    const doc = addTracker(base, { ...documentWith("weather").trackers[0]!, icon: "🌤️" });
    const next = modernizeIcons(doc);
    expect(next.trackers[0]).toBe(doc.trackers[0]);
    expect(next.trackers[1]?.icon).toBe("partly_cloudy_day");
  });
});

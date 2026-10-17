import { describe, expect, it } from "vitest";
import { adoptDayNotes } from "./adopt";
import { createEmptyDocument } from "./defaults";
import { documentWith } from "./fixtures";
import { setChoice, setNote } from "./marks";
import { createTrackerFromPreset, PRESETS } from "./presets";
import { addTracker } from "./trackers";

let counter = 0;
const newId = (prefix: "log") => `${prefix}_${String((counter += 1))}`;

function withNotesTracker(doc = createEmptyDocument()) {
  const preset = PRESETS.find((candidate) => candidate.key === "notes");
  if (!preset) {
    throw new Error("preset missing");
  }
  const tracker = createTrackerFromPreset(preset, (prefix) => `${prefix}_notes`);
  return { doc: addTracker(doc, tracker), tracker };
}

describe("adoptDayNotes", () => {
  it("returns the same document without a notes tracker", () => {
    const doc = setNote(documentWith("weather"), "2026-10-17", "Hallo");
    expect(adoptDayNotes(doc, newId)).toBe(doc);
  });

  it("returns the same document when no day has a note", () => {
    const { doc } = withNotesTracker(
      setChoice(documentWith("weather"), "2026-10-17", "trk_weather", "opt_weather_1"),
    );
    expect(adoptDayNotes(doc, newId)).toBe(doc);
  });

  it("turns every day note into an entry on its date, oldest first, and clears the note", () => {
    let base = documentWith("weather");
    base = setChoice(base, "2026-10-17", "trk_weather", "opt_weather_1");
    base = setNote(base, "2026-10-17", "Heute");
    base = setNote(base, "2026-03-05", "Im März");
    base = setNote(base, "2026-04-01", "   ");
    const { doc, tracker } = withNotesTracker(base);
    const adopted = adoptDayNotes(doc, newId);
    expect(adopted.logItems).toMatchObject([
      { trackerId: tracker.id, date: "2026-03-05", title: "", rating: 0, note: "Im März" },
      { trackerId: tracker.id, date: "2026-10-17", title: "", rating: 0, note: "Heute" },
    ]);
    expect(new Set(adopted.logItems.map((item) => item.id)).size).toBe(2);
    // The marks stay, a day that only had a note disappears, a blank note is not an entry.
    expect(adopted.days["2026-10-17"]).toEqual({
      marks: { trk_weather: ["opt_weather_1"] },
      note: "",
    });
    expect(adopted.days["2026-03-05"]).toBeUndefined();
    expect(adopted.days["2026-04-01"]?.note).toBe("   ");
  });

  it("does nothing the second time", () => {
    const { doc } = withNotesTracker(setNote(createEmptyDocument(), "2026-10-17", "Heute"));
    const once = adoptDayNotes(doc, newId);
    expect(adoptDayNotes(once, newId)).toBe(once);
  });

  it("keeps the entries that already exist", () => {
    const { doc, tracker } = withNotesTracker(
      setNote(createEmptyDocument(), "2026-10-17", "Heute"),
    );
    const existing = {
      id: "log_old",
      trackerId: tracker.id,
      date: "2026-10-16",
      title: "",
      rating: 0,
      note: "Alt",
    };
    const adopted = adoptDayNotes({ ...doc, logItems: [existing] }, newId);
    expect(adopted.logItems.map((item) => item.note)).toEqual(["Alt", "Heute"]);
  });
});

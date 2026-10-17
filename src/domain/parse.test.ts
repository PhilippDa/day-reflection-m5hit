import { describe, expect, it } from "vitest";
import { createEmptyDocument } from "./defaults";
import { documentWith, trackerFrom } from "./fixtures";
import { addLogItem } from "./logs";
import { setChoice, setNote } from "./marks";
import { parseDocument } from "./parse";

const DAY = "2026-10-17";

function sample() {
  let doc = documentWith("weather", "household", "movies");
  doc = setChoice(doc, DAY, "trk_weather", "opt_weather_1");
  doc = setNote(doc, DAY, "Guter Tag");
  return addLogItem(doc, {
    id: "log_1",
    trackerId: "trk_movies",
    date: DAY,
    title: "Wicked",
    rating: 4,
    note: "",
  });
}

function invalidPath(raw: unknown): string | undefined {
  const result = parseDocument(raw);
  return !result.ok && result.error.code === "invalid" ? result.error.path : undefined;
}

describe("parseDocument", () => {
  it("accepts the empty document and a full one, also after a trip through JSON", () => {
    const empty = createEmptyDocument();
    expect(parseDocument(empty)).toEqual({ ok: true, value: empty });
    const doc = sample();
    expect(parseDocument(JSON.parse(JSON.stringify(doc)))).toEqual({ ok: true, value: doc });
  });

  it("keeps unknown fields at every level", () => {
    const doc = sample();
    const first = doc.trackers[0];
    if (!first) {
      throw new Error("no tracker");
    }
    const raw = {
      ...doc,
      futureTop: 1,
      trackers: [
        { ...first, futureTracker: true, options: [{ ...first.options[0], futureOption: 2 }] },
      ],
      days: { [DAY]: { ...doc.days[DAY], futureDay: 3 } },
    };
    const result = parseDocument(raw);
    expect(result.ok && result.value["futureTop"]).toBe(1);
    expect(result.ok && result.value.trackers[0]?.["futureTracker"]).toBe(true);
    expect(result.ok && result.value.trackers[0]?.options[0]?.["futureOption"]).toBe(2);
    expect(result.ok && result.value.days[DAY]?.["futureDay"]).toBe(3);
  });

  it("rejects an unknown kind, an unknown view and a mismatch between them", () => {
    const tracker = trackerFrom("weather");
    const make = (patch: Record<string, unknown>) => ({
      ...createEmptyDocument(),
      trackers: [{ ...tracker, ...patch }],
    });
    expect(invalidPath(make({ kind: "chart" }))).toBe("trackers.0.kind");
    expect(invalidPath(make({ view: "pie" }))).toBe("trackers.0.view");
    expect(invalidPath(make({ view: "board" }))).toBe("trackers.0");
    expect(invalidPath(make({ kind: "log" }))).toBe("trackers.0");
  });

  it("rejects colors that are not #rrggbb and unknown shapes", () => {
    const tracker = trackerFrom("household");
    const first = tracker.options[0];
    const make = (patch: Record<string, unknown>) => ({
      ...createEmptyDocument(),
      trackers: [{ ...tracker, options: [{ ...first, ...patch }] }],
    });
    expect(invalidPath(make({ color: "red" }))).toBe("trackers.0.options.0.color");
    expect(invalidPath(make({ color: "#fff" }))).toBe("trackers.0.options.0.color");
    expect(invalidPath(make({ shape: "star" }))).toBe("trackers.0.options.0.shape");
    expect(parseDocument(make({ color: "#AbCdEf" })).ok).toBe(true);
  });

  it("rejects bad day keys, bad marks and bad log items", () => {
    const base = createEmptyDocument();
    const day = { marks: {}, note: "" };
    expect(invalidPath({ ...base, days: { "2026-02-30": day } })).toBe("days.2026-02-30");
    expect(invalidPath({ ...base, days: { heute: day } })).toBe("days.heute");
    expect(invalidPath({ ...base, days: { [DAY]: { marks: { trk_x: "opt" }, note: "" } } })).toBe(
      `days.${DAY}.marks.trk_x`,
    );
    const item = { id: "l", trackerId: "t", date: DAY, title: "x", rating: 3, note: "" };
    expect(invalidPath({ ...base, logItems: [{ ...item, rating: 6 }] })).toBe("logItems.0.rating");
    expect(invalidPath({ ...base, logItems: [{ ...item, rating: 2.5 }] })).toBe(
      "logItems.0.rating",
    );
    expect(invalidPath({ ...base, logItems: [{ ...item, date: "2026-13-01" }] })).toBe(
      "logItems.0.date",
    );
    expect(parseDocument({ ...base, logItems: [{ ...item, rating: 0 }] }).ok).toBe(true);
  });

  it("accepts marks that point at a deleted option", () => {
    const doc = {
      ...createEmptyDocument(),
      days: { [DAY]: { marks: { trk_gone: ["opt_gone"] }, note: "" } },
    };
    expect(parseDocument(doc).ok).toBe(true);
  });

  it("calls an old version 1 file outdated, not newer", () => {
    expect(parseDocument({ version: 1, categories: [], templates: [], days: {} })).toEqual({
      ok: false,
      error: { code: "outdated-version", version: 1 },
    });
    expect(parseDocument({ version: 3 })).toEqual({
      ok: false,
      error: { code: "unsupported-version", version: 3 },
    });
  });
});

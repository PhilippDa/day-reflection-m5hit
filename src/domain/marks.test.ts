import { describe, expect, it } from "vitest";
import { documentWith } from "./fixtures";
import { clearMarks, setChoice, setNote, toggleChoice, toggleHabit } from "./marks";

const DAY = "2026-10-17";
const SUN = "opt_weather_1";
const CLOUD = "opt_weather_2";

describe("setChoice", () => {
  it("picks one option and replaces an earlier pick", () => {
    const doc = documentWith("weather");
    const picked = setChoice(doc, DAY, "trk_weather", SUN);
    expect(picked.days[DAY]?.marks).toEqual({ trk_weather: [SUN] });
    const replaced = setChoice(picked, DAY, "trk_weather", CLOUD);
    expect(replaced.days[DAY]?.marks).toEqual({ trk_weather: [CLOUD] });
  });

  it("returns the same document when nothing changes", () => {
    const picked = setChoice(documentWith("weather"), DAY, "trk_weather", SUN);
    expect(setChoice(picked, DAY, "trk_weather", SUN)).toBe(picked);
  });

  it("rejects unknown trackers and options, other kinds and bad dates", () => {
    const doc = documentWith("weather", "household", "movies");
    expect(setChoice(doc, DAY, "trk_nope", SUN)).toBe(doc);
    expect(setChoice(doc, DAY, "trk_weather", "opt_nope")).toBe(doc);
    expect(setChoice(doc, DAY, "trk_household", "opt_household_1")).toBe(doc);
    expect(setChoice(doc, DAY, "trk_movies", SUN)).toBe(doc);
    expect(setChoice(doc, "2026-02-30", "trk_weather", SUN)).toBe(doc);
    expect(setChoice(doc, "heute", "trk_weather", SUN)).toBe(doc);
  });

  it("keeps the marks of other trackers on the same day", () => {
    let doc = documentWith("weather", "stress");
    doc = setChoice(doc, DAY, "trk_weather", SUN);
    doc = setChoice(doc, DAY, "trk_stress", "opt_stress_1");
    expect(doc.days[DAY]?.marks).toEqual({ trk_weather: [SUN], trk_stress: ["opt_stress_1"] });
  });
});

describe("toggleChoice", () => {
  it("picks on the first tap and clears on the second", () => {
    const doc = documentWith("weather");
    const picked = toggleChoice(doc, DAY, "trk_weather", SUN);
    expect(picked.days[DAY]?.marks["trk_weather"]).toEqual([SUN]);
    const cleared = toggleChoice(picked, DAY, "trk_weather", SUN);
    expect(cleared.days).toEqual({});
  });

  it("switches to another option with one tap", () => {
    const picked = toggleChoice(documentWith("weather"), DAY, "trk_weather", SUN);
    expect(toggleChoice(picked, DAY, "trk_weather", CLOUD).days[DAY]?.marks["trk_weather"]).toEqual(
      [CLOUD],
    );
  });
});

describe("toggleHabit", () => {
  it("switches habits on and off independently", () => {
    let doc = documentWith("household");
    doc = toggleHabit(doc, DAY, "trk_household", "opt_household_1");
    doc = toggleHabit(doc, DAY, "trk_household", "opt_household_3");
    expect(doc.days[DAY]?.marks["trk_household"]).toEqual(["opt_household_1", "opt_household_3"]);
    doc = toggleHabit(doc, DAY, "trk_household", "opt_household_1");
    expect(doc.days[DAY]?.marks["trk_household"]).toEqual(["opt_household_3"]);
  });

  it("removes the day when the last habit is switched off", () => {
    let doc = toggleHabit(documentWith("household"), DAY, "trk_household", "opt_household_1");
    doc = toggleHabit(doc, DAY, "trk_household", "opt_household_1");
    expect(doc.days).toEqual({});
  });

  it("only works on habit trackers with known habits", () => {
    const doc = documentWith("household", "weather");
    expect(toggleHabit(doc, DAY, "trk_weather", SUN)).toBe(doc);
    expect(toggleHabit(doc, DAY, "trk_household", "opt_nope")).toBe(doc);
  });
});

describe("clearMarks", () => {
  it("removes the picks of one tracker and prunes an empty day", () => {
    const picked = setChoice(documentWith("weather"), DAY, "trk_weather", SUN);
    expect(clearMarks(picked, DAY, "trk_weather").days).toEqual({});
  });

  it("returns the same document when there is nothing to clear", () => {
    const doc = documentWith("weather");
    expect(clearMarks(doc, DAY, "trk_weather")).toBe(doc);
    expect(clearMarks(doc, DAY, "trk_nope")).toBe(doc);
  });
});

describe("setNote", () => {
  it("creates the day, keeps it while it has a note, and removes it when empty again", () => {
    const doc = documentWith("weather");
    const noted = setNote(doc, DAY, "Guter Tag");
    expect(noted.days[DAY]).toEqual({ marks: {}, note: "Guter Tag" });
    expect(setNote(noted, DAY, "")).toMatchObject({ days: {} });
  });

  it("keeps the marks when the note is cleared", () => {
    const picked = setChoice(documentWith("weather"), DAY, "trk_weather", SUN);
    const cleared = setNote(setNote(picked, DAY, "x"), DAY, "");
    expect(cleared.days[DAY]?.marks).toEqual({ trk_weather: [SUN] });
  });

  it("returns the same document for an unchanged note or a bad date", () => {
    const doc = documentWith("weather");
    expect(setNote(doc, DAY, "")).toBe(doc);
    expect(setNote(doc, "2026-13-01", "x")).toBe(doc);
  });
});

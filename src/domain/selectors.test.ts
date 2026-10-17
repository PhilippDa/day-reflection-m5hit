import { describe, expect, it } from "vitest";
import { createEmptyDocument } from "./defaults";
import { documentWith } from "./fixtures";
import { addLogItem } from "./logs";
import { setChoice, setNote, toggleHabit } from "./marks";
import {
  backupReminder,
  dailyTrackers,
  dayProgress,
  getDay,
  getTracker,
  markedDays,
  optionCounts,
  optionUsage,
  pickCountsOfMonth,
  pickedOptionIds,
  summarize,
} from "./selectors";
import { deleteOption } from "./trackers";

const DAY = "2026-10-17";

describe("getDay and getTracker", () => {
  it("gives an empty day without storing it", () => {
    const doc = documentWith("weather");
    expect(getDay(doc, DAY)).toEqual({ marks: {}, note: "" });
    expect(doc.days).toEqual({});
  });

  it("finds trackers by id", () => {
    const doc = documentWith("weather");
    expect(getTracker(doc, "trk_weather")?.title).toBe("Wetter");
    expect(getTracker(doc, "trk_nope")).toBeUndefined();
  });
});

describe("summarize", () => {
  it("counts days, marks and log items", () => {
    expect(summarize(createEmptyDocument())).toEqual({ days: 0, marks: 0, logItems: 0 });
    let doc = documentWith("weather", "stress", "household", "movies");
    doc = setChoice(doc, DAY, "trk_weather", "opt_weather_1");
    doc = setChoice(doc, DAY, "trk_stress", "opt_stress_1");
    doc = toggleHabit(doc, DAY, "trk_household", "opt_household_1");
    doc = toggleHabit(doc, DAY, "trk_household", "opt_household_2");
    doc = setChoice(doc, "2026-10-18", "trk_weather", "opt_weather_2");
    doc = addLogItem(doc, {
      id: "log_1",
      trackerId: "trk_movies",
      date: DAY,
      title: "Wicked",
      rating: 4,
      note: "",
    });
    // Habits count once per day, however many were done.
    expect(summarize(doc)).toEqual({ days: 2, marks: 4, logItems: 1 });
  });

  it("counts a day that only has a note", () => {
    expect(summarize(setNote(createEmptyDocument(), DAY, "x"))).toEqual({
      days: 1,
      marks: 0,
      logItems: 0,
    });
  });
});

describe("dayProgress", () => {
  it("counts daily trackers that are filled and ignores logs", () => {
    let doc = documentWith("weather", "stress", "movies");
    expect(dailyTrackers(doc).map((tracker) => tracker.id)).toEqual(["trk_weather", "trk_stress"]);
    expect(dayProgress(doc, DAY)).toEqual({ filled: 0, total: 2 });
    doc = setChoice(doc, DAY, "trk_weather", "opt_weather_1");
    expect(dayProgress(doc, DAY)).toEqual({ filled: 1, total: 2 });
    expect(dayProgress(doc, "2026-10-18")).toEqual({ filled: 0, total: 2 });
  });

  it("is 0 of 0 without trackers", () => {
    expect(dayProgress(createEmptyDocument(), DAY)).toEqual({ filled: 0, total: 0 });
  });
});

describe("pickedOptionIds", () => {
  it("lists what is picked, or nothing", () => {
    const doc = setChoice(documentWith("weather"), DAY, "trk_weather", "opt_weather_2");
    expect(pickedOptionIds(doc, DAY, "trk_weather")).toEqual(["opt_weather_2"]);
    expect(pickedOptionIds(doc, DAY, "trk_stress")).toEqual([]);
    expect(pickedOptionIds(doc, "2026-10-18", "trk_weather")).toEqual([]);
  });
});

function loggedWeather() {
  let doc = documentWith("weather");
  doc = setChoice(doc, "2026-10-01", "trk_weather", "opt_weather_1");
  doc = setChoice(doc, "2026-10-02", "trk_weather", "opt_weather_1");
  doc = setChoice(doc, "2026-11-01", "trk_weather", "opt_weather_2");
  doc = setChoice(doc, "2025-12-31", "trk_weather", "opt_weather_1");
  return doc;
}

describe("optionCounts", () => {
  it("counts per option for a year or a month", () => {
    const doc = loggedWeather();
    expect(optionCounts(doc, "trk_weather", "2026").byOption).toEqual({
      opt_weather_1: 2,
      opt_weather_2: 1,
    });
    expect(optionCounts(doc, "trk_weather", "2026-10").byOption).toEqual({ opt_weather_1: 2 });
    expect(optionCounts(doc, "trk_weather", "2027")).toEqual({ byOption: {}, unknown: 0 });
  });

  it("counts days with a deleted option as unknown", () => {
    const doc = deleteOption(loggedWeather(), "trk_weather", "opt_weather_1");
    expect(optionCounts(doc, "trk_weather", "2026")).toEqual({
      byOption: { opt_weather_2: 1 },
      unknown: 2,
    });
  });

  it("counts every habit of a day", () => {
    let doc = documentWith("household");
    doc = toggleHabit(doc, DAY, "trk_household", "opt_household_1");
    doc = toggleHabit(doc, DAY, "trk_household", "opt_household_2");
    expect(optionCounts(doc, "trk_household", "2026").byOption).toEqual({
      opt_household_1: 1,
      opt_household_2: 1,
    });
  });
});

describe("optionUsage", () => {
  it("tells in how many days an option is used", () => {
    let doc = documentWith("weather");
    doc = setChoice(doc, "2026-10-01", "trk_weather", "opt_weather_1");
    doc = setChoice(doc, "2026-10-02", "trk_weather", "opt_weather_1");
    expect(optionUsage(doc, "trk_weather", "opt_weather_1")).toBe(2);
    expect(optionUsage(doc, "trk_weather", "opt_weather_2")).toBe(0);
  });
});

describe("backupReminder", () => {
  const now = new Date("2026-10-17T12:00:00.000Z");

  it("stays quiet while nothing is recorded", () => {
    expect(backupReminder(null, 0, now)).toBeNull();
  });

  it("asks for a first backup once something is recorded", () => {
    expect(backupReminder(null, 3, now)).toBe("never");
  });

  it("asks again after a week", () => {
    expect(backupReminder("2026-10-11T12:00:00.000Z", 3, now)).toBeNull();
    expect(backupReminder("2026-10-10T12:00:00.000Z", 3, now)).toBe("stale");
  });

  it("treats an unreadable timestamp as stale", () => {
    expect(backupReminder("kaputt", 3, now)).toBe("stale");
  });
});

describe("markedDays", () => {
  it("counts days with a pick in the period, not picks", () => {
    let doc = documentWith("weather", "household");
    doc = setChoice(doc, "2026-10-17", "trk_weather", "opt_weather_1");
    doc = setChoice(doc, "2026-10-18", "trk_weather", "opt_weather_2");
    doc = setChoice(doc, "2026-11-01", "trk_weather", "opt_weather_1");
    doc = toggleHabit(doc, "2026-10-17", "trk_household", "opt_household_1");
    expect(markedDays(doc, "trk_weather", "2026")).toBe(3);
    expect(markedDays(doc, "trk_weather", "2026-10")).toBe(2);
    expect(markedDays(doc, "trk_household", "2026")).toBe(1);
    expect(markedDays(doc, "trk_weather", "2025")).toBe(0);
  });
});

describe("pickCountsOfMonth", () => {
  it("lists every real day of the month with its number of picks", () => {
    let doc = documentWith("household");
    doc = toggleHabit(doc, "2026-02-03", "trk_household", "opt_household_1");
    doc = toggleHabit(doc, "2026-02-03", "trk_household", "opt_household_2");
    doc = toggleHabit(doc, "2026-02-28", "trk_household", "opt_household_2");
    const days = pickCountsOfMonth(doc, "trk_household", 2026, 2);
    expect(days).toHaveLength(28);
    expect(days[2]).toEqual({ dateKey: "2026-02-03", day: 3, count: 2 });
    expect(days[27]).toEqual({ dateKey: "2026-02-28", day: 28, count: 1 });
    expect(days[0]?.count).toBe(0);
  });
});

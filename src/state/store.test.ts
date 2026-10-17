import { describe, expect, it, vi } from "vitest";
import { createEmptyDocument } from "../domain/defaults";
import { documentWith } from "../domain/fixtures";
import { setChoice, setNote } from "../domain/marks";
import type { ExportEnvironment } from "../storage/backup";
import { createMemoryPort } from "../storage/memory";
import type { StoragePort } from "../storage/port";
import { createRepository } from "../storage/repository";
import { createStore } from "./store";

const TODAY = "2026-10-17";

function fakeEnv(outcome: "share" | "cancel" | "download") {
  const download = vi.fn<(file: File) => void>();
  const env: ExportEnvironment = {
    canShareFiles: () => outcome !== "download",
    share: () =>
      outcome === "cancel"
        ? Promise.reject(new DOMException("cancelled", "AbortError"))
        : Promise.resolve(),
    download,
  };
  return { env, download };
}

function setup(
  options: { port?: StoragePort; now?: () => Date; exportEnv?: ExportEnvironment } = {},
) {
  const port = options.port ?? createMemoryPort();
  const repository = createRepository(port);
  let counter = 0;
  const store = createStore({
    repository,
    now: options.now ?? (() => new Date(2026, 9, 17, 20, 0)),
    newId: (prefix) => `${prefix}_${String((counter += 1))}`,
    ...(options.exportEnv ? { exportEnv: options.exportEnv } : {}),
  });
  return { port, repository, store };
}

/** A store that already has the weather preset, so tests can start picking. */
async function withWeather(options: Parameters<typeof setup>[0] = {}) {
  const result = setup(options);
  await result.store.load();
  result.store.addPresets(["weather"]);
  const tracker = result.store.trackers.value[0];
  const option = tracker?.options[0];
  if (!tracker || !option) {
    throw new Error("preset missing");
  }
  return { ...result, tracker, option };
}

describe("store loading", () => {
  it("starts loading and becomes ready with an empty document", async () => {
    const { store } = setup();
    expect(store.status.value).toBe("loading");
    await store.load();
    expect(store.status.value).toBe("ready");
    expect(store.trackers.value).toEqual([]);
    expect(store.progress.value).toEqual({ filled: 0, total: 0 });
  });

  it("reports corrupt stored data and refuses to overwrite it", async () => {
    const port = createMemoryPort();
    await port.write("current", { version: 2, trackers: "kaputt" });
    const { store } = setup({ port });
    await store.load();
    expect(store.status.value).toBe("error");
    expect(store.loadError.value).toMatchObject({ code: "invalid" });

    store.addPresets(["weather"]);
    await store.whenSaved();
    expect(await port.read("current")).toEqual({ version: 2, trackers: "kaputt" });
  });

  it("reports a file from the old checklist app as outdated, without overwriting it", async () => {
    const port = createMemoryPort();
    await port.write("current", { version: 1, categories: [] });
    const { store } = setup({ port });
    await store.load();
    expect(store.loadError.value).toMatchObject({ code: "outdated-version" });
    expect(await port.read("current")).toEqual({ version: 1, categories: [] });
  });

  it("reports unavailable storage", async () => {
    const broken: StoragePort = {
      read: () => Promise.reject(new Error("blocked")),
      write: () => Promise.reject(new Error("blocked")),
    };
    const { store } = setup({ port: broken });
    await store.load();
    expect(store.status.value).toBe("error");
    expect(store.loadError.value).toEqual({ code: "storage-unavailable" });
  });
});

describe("store trackers and picks", () => {
  it("adds presets as trackers with fresh ids and ignores unknown keys", async () => {
    const { store } = setup();
    await store.load();
    store.addPresets(["weather", "nope", "stress"]);
    expect(store.trackers.value.map((tracker) => tracker.title)).toEqual(["Wetter", "Stress"]);
    expect(store.trackers.value[0]?.id).toBe("trk_8");
  });

  it("picks an option for the selected day, and a second tap clears it", async () => {
    const { store, tracker, option } = await withWeather();
    store.toggleChoice(tracker.id, option.id);
    expect(store.day.value.marks[tracker.id]).toEqual([option.id]);
    expect(store.progress.value).toEqual({ filled: 1, total: 1 });
    store.toggleChoice(tracker.id, option.id);
    expect(store.day.value.marks).toEqual({});
    expect(store.progress.value).toEqual({ filled: 0, total: 1 });
  });

  it("switches habits independently", async () => {
    const { store } = setup();
    await store.load();
    store.addPresets(["household"]);
    const tracker = store.trackers.value[0];
    const [first, second] = tracker?.options ?? [];
    if (!tracker || !first || !second) {
      throw new Error("preset missing");
    }
    store.toggleHabit(tracker.id, first.id);
    store.toggleHabit(tracker.id, second.id);
    expect(store.day.value.marks[tracker.id]).toEqual([first.id, second.id]);
    store.toggleHabit(tracker.id, first.id);
    expect(store.day.value.marks[tracker.id]).toEqual([second.id]);
  });

  it("keeps log trackers out of the daily list", async () => {
    const { store } = setup();
    await store.load();
    store.addPresets(["weather", "movies"]);
    expect(store.trackers.value).toHaveLength(2);
    expect(store.daily.value.map((tracker) => tracker.title)).toEqual(["Wetter"]);
  });

  it("persists every change, in order", async () => {
    const { store, repository, tracker, option } = await withWeather();
    store.toggleChoice(tracker.id, option.id);
    store.updateTracker(tracker.id, { title: "Himmel" });
    await store.whenSaved();
    const saved = await repository.load();
    expect(saved).toMatchObject({
      ok: true,
      value: {
        trackers: [{ title: "Himmel" }],
        days: { [TODAY]: { marks: { [tracker.id]: [option.id] } } },
      },
    });
  });

  it("does not write when nothing changed", async () => {
    const write = vi.fn<StoragePort["write"]>();
    const memory = createMemoryPort();
    const { store } = setup({
      port: {
        read: (slot) => memory.read(slot),
        write: (slot, value) => (write(slot, value), memory.write(slot, value)),
      },
    });
    await store.load();
    store.toggleChoice("trk_unknown", "opt_unknown");
    await store.whenSaved();
    expect(write).not.toHaveBeenCalled();
  });

  it("flags a failed save and recovers on the next one", async () => {
    let failing = false;
    const memory = createMemoryPort();
    const flaky: StoragePort = {
      read: (slot) => memory.read(slot),
      write: (slot, value) =>
        failing ? Promise.reject(new Error("full")) : memory.write(slot, value),
    };
    const { store, tracker, option } = await withWeather({ port: flaky });
    failing = true;
    store.toggleChoice(tracker.id, option.id);
    await store.whenSaved();
    expect(store.saveFailed.value).toBe(true);
    expect(store.day.value.marks[tracker.id]).toEqual([option.id]);

    failing = false;
    store.toggleChoice(tracker.id, option.id);
    await store.whenSaved();
    expect(store.saveFailed.value).toBe(false);
  });

  it("ignores actions before the data is loaded", () => {
    const { store } = setup();
    store.addPresets(["weather"]);
    store.toggleChoice("trk_x", "opt_x");
    expect(store.trackers.value).toEqual([]);
  });
});

describe("day navigation", () => {
  it("steps back and forward but never past today", async () => {
    const { store } = setup();
    await store.load();
    expect(store.isToday.value).toBe(true);
    expect(store.canGoNext.value).toBe(false);
    store.nextDay();
    expect(store.selectedDate.value).toBe(TODAY);

    store.previousDay();
    expect(store.selectedDate.value).toBe("2026-10-16");
    expect(store.canGoNext.value).toBe(true);
    store.nextDay();
    expect(store.selectedDate.value).toBe(TODAY);
  });

  it("shows each day's own picks", async () => {
    const { store, tracker, option } = await withWeather();
    store.toggleChoice(tracker.id, option.id);
    store.previousDay();
    expect(store.day.value.marks).toEqual({});
    store.toggleChoice(tracker.id, option.id);
    store.goToToday();
    expect(store.day.value.marks[tracker.id]).toEqual([option.id]);
  });

  it("selectDate ignores invalid keys and days in the future", async () => {
    const { store } = setup();
    await store.load();
    store.selectDate("2026-02-30");
    store.selectDate("morgen");
    store.selectDate("2026-10-18");
    expect(store.selectedDate.value).toBe(TODAY);
    store.selectDate("2026-10-01");
    expect(store.selectedDate.value).toBe("2026-10-01");
  });

  it("syncToday moves a selection that followed today, but not a past one", async () => {
    let clock = new Date(2026, 9, 17, 23, 0);
    const { store } = setup({ now: () => clock });
    await store.load();
    clock = new Date(2026, 9, 18, 8, 0);
    store.syncToday();
    expect(store.todayKey.value).toBe("2026-10-18");
    expect(store.selectedDate.value).toBe("2026-10-18");

    store.selectDate("2026-10-10");
    clock = new Date(2026, 9, 19, 8, 0);
    store.syncToday();
    expect(store.todayKey.value).toBe("2026-10-19");
    expect(store.selectedDate.value).toBe("2026-10-10");
    expect(store.canGoNext.value).toBe(true);
  });
});

describe("store backup", () => {
  it("asks for a first backup once something is picked", async () => {
    const { store, tracker, option } = await withWeather({ exportEnv: fakeEnv("share").env });
    expect(store.backupReminder.value).toBeNull();
    store.toggleChoice(tracker.id, option.id);
    expect(store.backupReminder.value).toBe("never");
  });

  it("remembers a successful export, also across a reload", async () => {
    const { store, repository, tracker, option } = await withWeather({
      exportEnv: fakeEnv("share").env,
    });
    store.toggleChoice(tracker.id, option.id);
    expect(await store.exportBackup()).toBe("shared");
    expect(store.lastExportedAt.value).not.toBeNull();
    expect(store.backupReminder.value).toBeNull();

    const reloaded = createStore({ repository });
    await reloaded.load();
    expect(reloaded.lastExportedAt.value).toBe(store.lastExportedAt.value);
  });

  it("does not count a cancelled share sheet as an export", async () => {
    const { store } = setup({ exportEnv: fakeEnv("cancel").env });
    await store.load();
    expect(await store.exportBackup()).toBe("cancelled");
    expect(store.lastExportedAt.value).toBeNull();
  });

  it("downloads when sharing is not possible", async () => {
    const { env, download } = fakeEnv("download");
    const { store } = setup({ exportEnv: env });
    await store.load();
    expect(await store.exportBackup()).toBe("downloaded");
    expect(download).toHaveBeenCalledOnce();
  });

  it("imports in two steps: read the file, then choose replace or merge", async () => {
    const { store, repository, tracker, option } = await withWeather();
    store.toggleChoice(tracker.id, option.id);
    await store.whenSaved();
    const other = setChoice(documentWith("weather"), "2026-10-01", "trk_weather", "opt_weather_1");

    store.readImport(JSON.stringify(other));
    expect(store.pendingImport.value?.summary).toEqual({ days: 1, marks: 1, logItems: 0 });
    expect(store.importError.value).toBeNull();

    await store.confirmImport("merge");
    expect(store.pendingImport.value).toBeNull();
    expect(store.summary.value).toEqual({ days: 2, marks: 2, logItems: 0 });
    const snapshot = await repository.loadSnapshot();
    expect(snapshot?.ok && Object.keys(snapshot.value.days)).toEqual([TODAY]);
  });

  it("rejects a broken file without touching the data", async () => {
    const { store, tracker, option } = await withWeather();
    store.toggleChoice(tracker.id, option.id);
    store.readImport("das ist kein json");
    expect(store.importError.value).toEqual({ code: "not-json" });
    expect(store.pendingImport.value).toBeNull();
    await store.confirmImport("replace");
    expect(store.summary.value.marks).toBe(1);
  });

  it("rejects an old checklist backup as outdated", async () => {
    const { store } = setup();
    await store.load();
    store.readImport(JSON.stringify({ version: 1, categories: [] }));
    expect(store.importError.value).toMatchObject({ code: "outdated-version" });
  });

  it("cancelling drops the pending import", async () => {
    const { store } = setup();
    await store.load();
    store.readImport(JSON.stringify(createEmptyDocument()));
    store.cancelImport();
    expect(store.pendingImport.value).toBeNull();
  });
});

describe("tracker detail", () => {
  it("opens a tracker on the current year and ignores unknown ids", async () => {
    const { store, tracker } = await withWeather();
    store.openTracker("trk_nope");
    expect(store.openedTracker.value).toBeNull();
    store.openTracker(tracker.id);
    expect(store.openedTracker.value?.id).toBe(tracker.id);
    expect(store.year.value).toBe(2026);
    expect(store.yearCells.value).toHaveLength(31);
    store.closeTracker();
    expect(store.openedTracker.value).toBeNull();
    expect(store.yearCells.value).toEqual([]);
  });

  it("moves between years but not into the future", async () => {
    const { store, tracker } = await withWeather();
    store.openTracker(tracker.id);
    expect(store.canGoNextYear.value).toBe(false);
    store.nextYear();
    expect(store.year.value).toBe(2026);
    store.previousYear();
    expect(store.year.value).toBe(2025);
    expect(store.canGoNextYear.value).toBe(true);
    store.nextYear();
    expect(store.year.value).toBe(2026);
  });

  it("edits any past day through the sheet without moving the Today screen", async () => {
    const { store, tracker, option } = await withWeather();
    store.openTracker(tracker.id);
    store.openDay("2026-03-05");
    expect(store.sheetDate.value).toBe("2026-03-05");
    expect(store.sheetPicks.value).toEqual([]);
    store.toggleChoice(tracker.id, option.id, "2026-03-05");
    expect(store.sheetPicks.value).toEqual([option.id]);
    expect(store.selectedDate.value).toBe(TODAY);
    expect(store.day.value.marks).toEqual({});
    expect(store.yearCounts.value.byOption[option.id]).toBe(1);
    expect(store.yearDays.value[tracker.id]).toBe(1);
    store.closeDay();
    expect(store.sheetDate.value).toBeNull();
  });

  it("refuses to open days that do not exist or lie ahead", async () => {
    const { store, tracker } = await withWeather();
    store.openTracker(tracker.id);
    store.openDay("2026-02-30");
    store.openDay("2026-10-18");
    expect(store.sheetDate.value).toBeNull();
  });

  it("gives choice trackers a preview of the last 14 days", async () => {
    const { store, tracker, option } = await withWeather();
    store.addPresets(["movies"]);
    store.toggleChoice(tracker.id, option.id);
    const preview = store.previews.value[tracker.id];
    expect(preview).toHaveLength(14);
    expect(preview?.at(-1)?.status).toBe("marked");
    expect(Object.keys(store.previews.value)).toEqual([tracker.id]);
  });
});

describe("month navigation", () => {
  it("starts on the current month and never goes past it", async () => {
    const { store, tracker } = await withWeather();
    store.openTracker(tracker.id);
    expect(store.month.value).toEqual({ year: 2026, month: 10 });
    expect(store.canGoNextMonth.value).toBe(false);
    store.nextMonth();
    expect(store.month.value).toEqual({ year: 2026, month: 10 });
    expect(store.monthCells.value).toHaveLength(31);
  });

  it("rolls over the year boundary and has the right number of days", async () => {
    const { store, tracker } = await withWeather();
    store.openTracker(tracker.id);
    for (let step = 0; step < 10; step += 1) {
      store.previousMonth();
    }
    expect(store.month.value).toEqual({ year: 2025, month: 12 });
    store.previousMonth();
    store.previousMonth();
    expect(store.month.value).toEqual({ year: 2025, month: 10 });
    for (let step = 0; step < 8; step += 1) {
      store.previousMonth();
    }
    expect(store.month.value).toEqual({ year: 2025, month: 2 });
    expect(store.monthCells.value).toHaveLength(28);
    expect(store.canGoNextMonth.value).toBe(true);
  });

  it("counts only the shown month", async () => {
    const { store, tracker, option } = await withWeather();
    store.toggleChoice(tracker.id, option.id);
    store.toggleChoice(tracker.id, option.id, "2026-09-30");
    store.openTracker(tracker.id);
    expect(store.monthCounts.value.byOption[option.id]).toBe(1);
    store.previousMonth();
    expect(store.monthCounts.value.byOption[option.id]).toBe(1);
    store.previousMonth();
    expect(store.monthCounts.value.byOption[option.id] ?? 0).toBe(0);
    expect(store.yearCounts.value.byOption[option.id]).toBe(2);
  });
});

async function withMovies() {
  const result = setup();
  await result.store.load();
  result.store.addPresets(["movies", "weather"]);
  const movies = result.store.trackers.value.find((tracker) => tracker.kind === "log");
  if (!movies) {
    throw new Error("preset missing");
  }
  return { ...result, movies };
}

describe("log items", () => {
  const draft = { date: TODAY, title: "Wicked", rating: 4, note: "" };

  it("lists log trackers apart from the daily ones", async () => {
    const { store, movies } = await withMovies();
    expect(store.logTrackers.value.map((tracker) => tracker.id)).toEqual([movies.id]);
    expect(store.daily.value).toHaveLength(1);
  });

  it("adds an item with a fresh id and shows it on its day only", async () => {
    const { store, movies } = await withMovies();
    store.addLogItem(movies.id, draft);
    store.addLogItem(movies.id, { ...draft, title: "Alt", date: "2026-10-01" });
    expect(store.dayLogItems.value[movies.id]?.map((item) => item.title)).toEqual(["Wicked"]);
    expect(store.dayLogItems.value[movies.id]?.[0]?.id).toMatch(/^log_/);
    store.previousDay();
    expect(store.dayLogItems.value[movies.id]).toEqual([]);
  });

  it("rejects a blank title and keeps an unrated item (0 stars)", async () => {
    const { store, movies } = await withMovies();
    store.addLogItem(movies.id, { ...draft, title: "  " });
    expect(store.summary.value.logItems).toBe(0);
    store.addLogItem(movies.id, { ...draft, rating: 0 });
    expect(store.dayLogItems.value[movies.id]?.[0]?.rating).toBe(0);
  });

  it("edits and deletes, and saves both", async () => {
    const { store, repository, movies } = await withMovies();
    store.addLogItem(movies.id, draft);
    const id = store.dayLogItems.value[movies.id]?.[0]?.id ?? "";
    store.updateLogItem(id, { rating: 5, note: "Toll" });
    expect(store.dayLogItems.value[movies.id]?.[0]).toMatchObject({ rating: 5, note: "Toll" });
    await store.whenSaved();
    const saved = await repository.load();
    expect(saved.ok && saved.value.logItems).toHaveLength(1);

    store.deleteLogItem(id);
    expect(store.summary.value.logItems).toBe(0);
  });

  it("shows the opened tracker's items newest first and counts them for the overview", async () => {
    const { store, movies } = await withMovies();
    store.addLogItem(movies.id, { ...draft, title: "Erster", date: "2026-03-01" });
    store.addLogItem(movies.id, { ...draft, title: "Zweiter", date: "2026-09-01" });
    store.addLogItem(movies.id, { ...draft, title: "Alt", date: "2025-12-31" });
    store.openTracker(movies.id);
    expect(store.openedLogItems.value.map((item) => item.title)).toEqual([
      "Zweiter",
      "Erster",
      "Alt",
    ]);
    expect(store.yearDays.value[movies.id]).toBe(2);
  });
});

const MY_OPTIONS = [
  { label: "Gut", color: "#6cbf5e", icon: "", shape: "" },
  { label: "Schlecht", color: "#d64550", icon: "", shape: "" },
] as const;

const MY_TRACKER = {
  title: "Laune",
  icon: "🙂",
  kind: "choice",
  view: "year-squares",
  options: MY_OPTIONS,
} as const;

describe("tracker editing", () => {
  it("creates a tracker from scratch with new ids and returns its id", async () => {
    const { store } = setup();
    await store.load();
    const id = store.createTracker(MY_TRACKER);
    expect(id).toBe("trk_1");
    expect(store.trackers.value[0]).toMatchObject({ id, title: "Laune", kind: "choice" });
    expect(store.trackers.value[0]?.options.map((option) => option.id)).toEqual(["opt_2", "opt_3"]);
  });

  it("refuses an invalid draft", async () => {
    const { store } = setup();
    await store.load();
    expect(store.createTracker({ ...MY_TRACKER, title: "  " })).toBeNull();
    expect(store.createTracker({ ...MY_TRACKER, options: [] })).toBeNull();
    expect(store.createTracker({ ...MY_TRACKER, kind: "log", view: "list" })).toBeNull();
    expect(store.createTracker({ ...MY_TRACKER, view: "list" })).toBeNull();
    expect(store.trackers.value).toEqual([]);
  });

  it("creates a list tracker without options", async () => {
    const { store } = setup();
    await store.load();
    const id = store.createTracker({ ...MY_TRACKER, kind: "log", view: "list", options: [] });
    expect(store.trackers.value.find((tracker) => tracker.id === id)?.options).toEqual([]);
  });

  it("renames, changes the view, reorders and saves", async () => {
    const { store, repository } = setup();
    await store.load();
    const first = store.createTracker(MY_TRACKER) ?? "";
    const second = store.createTracker({ ...MY_TRACKER, title: "Zweiter" }) ?? "";
    store.updateTracker(first, { title: "Stimmung", view: "year-dots" });
    store.moveTracker(second, -1);
    expect(store.trackers.value.map((tracker) => tracker.title)).toEqual(["Zweiter", "Stimmung"]);
    expect(store.trackers.value[1]?.view).toBe("year-dots");
    await store.whenSaved();
    const saved = await repository.load();
    expect(saved.ok && saved.value.trackers.map((tracker) => tracker.title)).toEqual([
      "Zweiter",
      "Stimmung",
    ]);
  });

  it("adds, recolors, moves and deletes options", async () => {
    const { store } = setup();
    await store.load();
    const id = store.createTracker(MY_TRACKER) ?? "";
    store.addOption(id, { label: "Okay", color: "#f6c945", icon: "", shape: "" });
    const [good, bad, okay] = store.trackers.value[0]?.options ?? [];
    store.updateOption(id, bad?.id ?? "", { color: "#8e2c48", label: "Mies" });
    store.moveOption(id, okay?.id ?? "", -1);
    expect(store.trackers.value[0]?.options.map((option) => option.label)).toEqual([
      "Gut",
      "Okay",
      "Mies",
    ]);
    expect(store.trackers.value[0]?.options[2]?.color).toBe("#8e2c48");
    store.deleteOption(id, good?.id ?? "");
    expect(store.trackers.value[0]?.options).toHaveLength(2);
  });

  it("never deletes the last option", async () => {
    const { store } = setup();
    await store.load();
    const id = store.createTracker({ ...MY_TRACKER, options: [MY_OPTIONS[0]] }) ?? "";
    store.deleteOption(id, store.trackers.value[0]?.options[0]?.id ?? "");
    expect(store.trackers.value[0]?.options).toHaveLength(1);
  });

  it("reports how much a delete would touch, and keeps marks of a deleted option as unknown", async () => {
    const { store } = setup();
    await store.load();
    const id = store.createTracker(MY_TRACKER) ?? "";
    const [good, bad] = store.trackers.value[0]?.options ?? [];
    store.toggleChoice(id, good?.id ?? "");
    store.toggleChoice(id, good?.id ?? "", "2026-10-16");
    store.toggleChoice(id, bad?.id ?? "", "2026-10-15");
    expect(store.trackerUsage(id)).toEqual({ days: 3, items: 0 });
    expect(store.optionDays(id, good?.id ?? "")).toBe(2);

    store.deleteOption(id, good?.id ?? "");
    store.openTracker(id);
    expect(store.yearCounts.value.unknown).toBe(2);
  });

  it("deleting a tracker removes its marks and list items", async () => {
    const { store } = setup();
    await store.load();
    const id = store.createTracker(MY_TRACKER) ?? "";
    const list =
      store.createTracker({ ...MY_TRACKER, kind: "log", view: "list", options: [] }) ?? "";
    store.toggleChoice(id, store.trackers.value[0]?.options[0]?.id ?? "");
    store.addLogItem(list, { date: TODAY, title: "Film", rating: 3, note: "" });
    expect(store.trackerUsage(list)).toEqual({ days: 0, items: 1 });
    store.deleteTracker(id);
    store.deleteTracker(list);
    expect(store.trackers.value).toEqual([]);
    expect(store.summary.value).toEqual({ days: 0, marks: 0, logItems: 0 });
  });

  it("closes the detail screen when its tracker is deleted", async () => {
    const { store } = setup();
    await store.load();
    const id = store.createTracker(MY_TRACKER) ?? "";
    store.openTracker(id);
    store.deleteTracker(id);
    expect(store.openedTracker.value).toBeNull();
  });
});

async function withHousehold() {
  const result = setup();
  await result.store.load();
  result.store.addPresets(["household"]);
  const tracker = result.store.trackers.value[0];
  if (!tracker) {
    throw new Error("preset missing");
  }
  return { ...result, tracker };
}

describe("habit board", () => {
  it("drops a block for every habit done in the shown month", async () => {
    const { store, tracker } = await withHousehold();
    const [a, b, c] = tracker.options;
    store.toggleHabit(tracker.id, a?.id ?? "");
    store.toggleHabit(tracker.id, b?.id ?? "");
    store.toggleHabit(tracker.id, c?.id ?? "", "2026-10-02");
    store.toggleHabit(tracker.id, a?.id ?? "", "2026-09-30");
    store.openTracker(tracker.id);
    expect(store.habitBoard.value.blocks).toHaveLength(3);
    expect(store.habitDays.value).toHaveLength(31);
    expect(store.habitDays.value[16]).toMatchObject({ dateKey: "2026-10-17", count: 2 });

    store.previousMonth();
    expect(store.habitBoard.value.blocks).toHaveLength(1);
    expect(store.habitDays.value).toHaveLength(30);
  });

  it("is empty for other trackers and when nothing is open", async () => {
    const { store, tracker } = await withHousehold();
    expect(store.habitBoard.value.blocks).toEqual([]);
    store.addPresets(["weather"]);
    const weather = store.trackers.value.find((t) => t.kind === "choice");
    store.toggleHabit(tracker.id, tracker.options[0]?.id ?? "");
    store.openTracker(weather?.id ?? "");
    expect(store.habitBoard.value.blocks).toEqual([]);
    expect(store.habitDays.value).toEqual([]);
  });

  it("edits a habit shape and the board follows", async () => {
    const { store, tracker } = await withHousehold();
    const first = tracker.options[0];
    store.toggleHabit(tracker.id, first?.id ?? "");
    store.openTracker(tracker.id);
    expect(store.habitBoard.value.blocks[0]?.cells).toHaveLength(1);
    store.updateOption(tracker.id, first?.id ?? "", { shape: "o" });
    expect(store.habitBoard.value.blocks[0]?.cells).toHaveLength(4);
  });
});

async function withNotes() {
  const result = setup();
  await result.store.load();
  result.store.addPresets(["notes"]);
  const tracker = result.store.logTrackers.value[0];
  if (!tracker) {
    throw new Error("preset missing");
  }
  return { ...result, tracker };
}

describe("notes tracker", () => {
  it("is a list tracker with text-only entries", async () => {
    const { tracker } = await withNotes();
    expect(tracker).toMatchObject({ title: "Notizen", kind: "log", view: "list", entries: "text" });
  });

  it("keeps entries that are only a date and a text", async () => {
    const { store, tracker } = await withNotes();
    store.addLogItem(tracker.id, { date: TODAY, title: "ignoriert", rating: 4, note: "Regen" });
    store.addLogItem(tracker.id, { date: TODAY, title: "Leer", rating: 0, note: "  " });
    expect(store.dayLogItems.value[tracker.id]).toMatchObject([
      { title: "", rating: 0, note: "Regen" },
    ]);
    const item = store.dayLogItems.value[tracker.id]?.[0];
    store.updateLogItem(item?.id ?? "", { note: "" });
    expect(store.dayLogItems.value[tracker.id]?.[0]?.note).toBe("Regen");
    store.updateLogItem(item?.id ?? "", { note: "Sonne", title: "x", rating: 3 });
    expect(store.dayLogItems.value[tracker.id]).toMatchObject([
      { title: "", rating: 0, note: "Sonne" },
    ]);
  });
});

function oldNotes() {
  let doc = documentWith("weather");
  doc = setNote(doc, "2026-10-01", "Erster");
  doc = setNote(doc, "2026-10-17", "Heute");
  return setChoice(doc, "2026-10-17", "trk_weather", "opt_weather_1");
}

describe("old day notes", () => {
  it("become entries when the notes tracker is added, and are not copied twice", async () => {
    const port = createMemoryPort();
    await port.write("current", oldNotes());
    const { store, repository } = setup({ port });
    await store.load();
    expect(store.logTrackers.value).toEqual([]);

    store.addPresets(["notes"]);
    const tracker = store.logTrackers.value[0];
    store.openTracker(tracker?.id ?? "");
    expect(store.openedLogItems.value).toMatchObject([
      { date: "2026-10-17", title: "", note: "Heute" },
      { date: "2026-10-01", title: "", note: "Erster" },
    ]);

    store.addPresets(["notes"]);
    expect(store.openedLogItems.value).toHaveLength(2);
    await store.whenSaved();
    const saved = await repository.load();
    expect(saved.ok && saved.value.days).toEqual({
      [TODAY]: { marks: { trk_weather: ["opt_weather_1"] }, note: "" },
    });
  });

  it("stay untouched without a notes tracker", async () => {
    const port = createMemoryPort();
    await port.write("current", oldNotes());
    const { store, repository } = setup({ port });
    await store.load();
    store.addPresets(["stress"]);
    await store.whenSaved();
    const saved = await repository.load();
    expect(saved.ok && saved.value.days["2026-10-01"]?.note).toBe("Erster");
  });
});

describe("icons from older data", () => {
  it("swaps old starter emoji when loading, and keeps emoji the user typed", async () => {
    const port = createMemoryPort();
    const doc = documentWith("weather");
    const tracker = doc.trackers[0];
    if (!tracker) {
      throw new Error("fixture missing");
    }
    await port.write("current", {
      ...doc,
      trackers: [
        {
          ...tracker,
          icon: "🌤️",
          options: tracker.options.map((option, i) => ({ ...option, icon: i === 0 ? "☀️" : "🌞" })),
        },
      ],
    });
    const { store } = setup({ port });
    await store.load();
    const loaded = store.trackers.value[0];
    expect(loaded?.icon).toBe("partly_cloudy_day");
    expect(loaded?.options.map((option) => option.icon)).toEqual(
      tracker.options.map((_option, i) => (i === 0 ? "sunny" : "🌞")),
    );
  });
});

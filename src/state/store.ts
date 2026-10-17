import { computed, signal, type ReadonlySignal } from "@preact/signals";
import {
  layoutBoard,
  monthBoardItems,
  type BoardLayout,
  type HabitBoardItem,
} from "../domain/board";
import { shiftMonth, type YearMonth } from "../domain/calendar";
import { monthCells, recentCells, yearCells, type TrackerCell } from "../domain/cells";
import { createEmptyDay } from "../domain/defaults";
import { addDays, isDateKey, toDateKey } from "../domain/dates";
import {
  addLogItem,
  deleteLogItem,
  logItemsOf,
  updateLogItem,
  type LogItemPatch,
} from "../domain/logs";
import { setNote, toggleChoice, toggleHabit } from "../domain/marks";
import type { ImportMode } from "../domain/merge";
import type { ParseError } from "../domain/parse";
import { createTrackerFromPreset, PRESETS } from "../domain/presets";
import {
  backupReminder,
  dailyTrackers,
  dayProgress,
  getDay,
  markedDays,
  optionCounts,
  optionUsage,
  pickCountsOfMonth,
  type DayCount,
  summarize,
  type BackupReminder,
  type DayProgress,
  type DocumentSummary,
  type OptionCounts,
} from "../domain/selectors";
import {
  addOption,
  addTracker,
  deleteOption,
  deleteTracker,
  moveOption,
  moveTracker,
  updateOption,
  updateTracker,
  type OptionPatch,
  type TrackerPatch,
} from "../domain/trackers";
import type {
  AppDocument,
  Day,
  LogItem,
  Option,
  Tracker,
  TrackerKind,
  TrackerView,
} from "../domain/types";
import {
  exportDocument,
  importDocument,
  parseImportFile,
  type ExportEnvironment,
  type ExportOutcome,
  type ImportFileError,
} from "../storage/backup";
import type { Repository } from "../storage/repository";

export type Status = "loading" | "ready" | "error";
export type LoadError = ParseError | { readonly code: "storage-unavailable" };

export interface StoreDeps {
  readonly repository: Repository;
  readonly now?: () => Date;
  readonly newId?: (prefix: "trk" | "opt" | "log") => string;
  readonly exportEnv?: ExportEnvironment;
}

export interface OptionDraft {
  readonly label: string;
  readonly color: string;
  readonly icon: string;
  readonly shape: Option["shape"];
}

export interface TrackerDraft {
  readonly title: string;
  readonly icon: string;
  readonly kind: TrackerKind;
  readonly view: TrackerView;
  /** Must be empty for log trackers and have at least one entry for the others. */
  readonly options: readonly OptionDraft[];
}

export interface LogItemDraft {
  readonly date: string;
  readonly title: string;
  readonly rating: number;
  readonly note: string;
}

/** A parsed import file that waits for the user to choose replace or merge. */
export interface PendingImport {
  readonly incoming: AppDocument;
  readonly summary: DocumentSummary;
}

export interface Store {
  readonly status: ReadonlySignal<Status>;
  readonly loadError: ReadonlySignal<LoadError | null>;
  /** True when the last attempt to write to storage failed. */
  readonly saveFailed: ReadonlySignal<boolean>;
  readonly selectedDate: ReadonlySignal<string>;
  readonly todayKey: ReadonlySignal<string>;
  readonly isToday: ReadonlySignal<boolean>;
  /** False on today: days in the future cannot be opened. */
  readonly canGoNext: ReadonlySignal<boolean>;
  readonly trackers: ReadonlySignal<readonly Tracker[]>;
  /** The trackers that are filled in every day (everything except logs). */
  readonly daily: ReadonlySignal<readonly Tracker[]>;
  readonly day: ReadonlySignal<Day>;
  readonly progress: ReadonlySignal<DayProgress>;
  /** The tracker whose detail screen is open, `null` on the overview. */
  readonly openedTracker: ReadonlySignal<Tracker | null>;
  /** The year shown in the detail screen. */
  readonly year: ReadonlySignal<number>;
  readonly canGoNextYear: ReadonlySignal<boolean>;
  /** The opened tracker's year as 31 rows by 12 columns. */
  readonly yearCells: ReadonlySignal<TrackerCell[][]>;
  readonly yearCounts: ReadonlySignal<OptionCounts>;
  /** The month shown for ring and stamp views. */
  readonly month: ReadonlySignal<YearMonth>;
  readonly canGoNextMonth: ReadonlySignal<boolean>;
  /** The opened tracker's days of the shown month, in order. */
  readonly monthCells: ReadonlySignal<TrackerCell[]>;
  readonly monthCounts: ReadonlySignal<OptionCounts>;
  /** The opened habit tracker's month as falling blocks. */
  readonly habitBoard: ReadonlySignal<BoardLayout<HabitBoardItem>>;
  /** The opened habit tracker's days of the shown month with their number of habits done. */
  readonly habitDays: ReadonlySignal<readonly DayCount[]>;
  /** The day being edited in the bottom sheet, `null` when it is closed. */
  readonly sheetDate: ReadonlySignal<string | null>;
  /** Option ids picked for the opened tracker on the sheet's day. */
  readonly sheetPicks: ReadonlySignal<readonly string[]>;
  /** Per tracker: the last days, for the small previews on the overview. */
  readonly previews: ReadonlySignal<Readonly<Record<string, TrackerCell[]>>>;
  /** The log trackers (lists such as movies). */
  readonly logTrackers: ReadonlySignal<readonly Tracker[]>;
  /** Per log tracker: its items on the selected day, oldest first. */
  readonly dayLogItems: ReadonlySignal<Readonly<Record<string, LogItem[]>>>;
  /** The opened log tracker's items, newest first. */
  readonly openedLogItems: ReadonlySignal<readonly LogItem[]>;
  /**
   * Per tracker: on how many days of the current year something is picked, or for log trackers
   * how many items there are.
   */
  readonly yearDays: ReadonlySignal<Readonly<Record<string, number>>>;
  /** ISO timestamp of the last export, `null` if there never was one. */
  readonly lastExportedAt: ReadonlySignal<string | null>;
  readonly backupReminder: ReadonlySignal<BackupReminder | null>;
  /** What the stored data contains, for the settings screen. */
  readonly summary: ReadonlySignal<DocumentSummary>;
  readonly pendingImport: ReadonlySignal<PendingImport | null>;
  readonly importError: ReadonlySignal<ImportFileError | null>;

  readonly load: () => Promise<void>;
  /** Switches to another day. Anything that is not a real date key, or lies ahead, is ignored. */
  readonly selectDate: (dateKey: string) => void;
  readonly previousDay: () => void;
  readonly nextDay: () => void;
  readonly goToToday: () => void;
  /** Call when the app becomes visible again: moves "today" forward after midnight. */
  readonly syncToday: () => void;
  readonly openTracker: (trackerId: string) => void;
  readonly closeTracker: () => void;
  readonly previousMonth: () => void;
  readonly nextMonth: () => void;
  readonly previousYear: () => void;
  readonly nextYear: () => void;
  /** Opens the sheet for a day. Days that do not exist or lie ahead are ignored. */
  readonly openDay: (dateKey: string) => void;
  readonly closeDay: () => void;
  /**
   * Tap on a legend chip of a choice tracker: picks it or clears it. Without a date, the
   * selected day on the Today screen is meant.
   */
  readonly toggleChoice: (trackerId: string, optionId: string, dateKey?: string) => void;
  readonly toggleHabit: (trackerId: string, optionId: string, dateKey?: string) => void;
  readonly setNote: (note: string) => void;
  /** Creates a tracker and returns its id, or `null` when the draft is not valid. */
  readonly createTracker: (draft: TrackerDraft) => string | null;
  readonly updateTracker: (trackerId: string, patch: TrackerPatch) => void;
  /** Also removes the tracker's marks and log items. Ask first, see `trackerUsage`. */
  readonly deleteTracker: (trackerId: string) => void;
  readonly moveTracker: (trackerId: string, delta: number) => void;
  readonly addOption: (trackerId: string, draft: OptionDraft) => void;
  readonly updateOption: (trackerId: string, optionId: string, patch: OptionPatch) => void;
  /** Marks stay and show up as "unknown" days. Ask first, see `optionDays`. */
  readonly deleteOption: (trackerId: string, optionId: string) => void;
  readonly moveOption: (trackerId: string, optionId: string, delta: number) => void;
  /** How many days have something picked for the tracker, and how many list items it has. */
  readonly trackerUsage: (trackerId: string) => { readonly days: number; readonly items: number };
  /** On how many days the option is picked. */
  readonly optionDays: (trackerId: string, optionId: string) => number;
  readonly addLogItem: (trackerId: string, draft: LogItemDraft) => void;
  readonly updateLogItem: (itemId: string, patch: LogItemPatch) => void;
  readonly deleteLogItem: (itemId: string) => void;
  /** Adds one tracker per preset key. Unknown keys are ignored. */
  readonly addPresets: (keys: readonly string[]) => void;
  /** Shares or downloads the backup file. "failed" means nothing was delivered. */
  readonly exportBackup: () => Promise<ExportOutcome | "failed">;
  /** Checks the text of a chosen file. A valid file waits in `pendingImport`, an invalid one sets `importError`. */
  readonly readImport: (text: string) => void;
  readonly confirmImport: (mode: ImportMode) => Promise<void>;
  readonly cancelImport: () => void;
  /** Resolves when every change made so far has been written. */
  readonly whenSaved: () => Promise<void>;
}

const randomId = (prefix: "trk" | "opt" | "log"): string => `${prefix}_${crypto.randomUUID()}`;

export function createStore(deps: StoreDeps): Store {
  const { repository } = deps;
  const now = deps.now ?? (() => new Date());
  const newId = deps.newId ?? randomId;

  const document = signal<AppDocument | null>(null);
  const status = signal<Status>("loading");
  const loadError = signal<LoadError | null>(null);
  const saveFailed = signal(false);
  const lastExportedAt = signal<string | null>(null);
  const pendingImport = signal<PendingImport | null>(null);
  const importError = signal<ImportFileError | null>(null);
  const todayKey = signal(toDateKey(now()));
  const selectedDate = signal(todayKey.value);
  const isToday = computed(() => selectedDate.value === todayKey.value);
  const canGoNext = computed(() => selectedDate.value < todayKey.value);

  const openedId = signal<string | null>(null);
  const year = signal(Number(todayKey.value.slice(0, 4)));
  const sheetDate = signal<string | null>(null);
  const todayYear = computed(() => Number(todayKey.value.slice(0, 4)));
  const month = signal<YearMonth>({
    year: Number(todayKey.value.slice(0, 4)),
    month: Number(todayKey.value.slice(5, 7)),
  });
  const canGoNextMonth = computed(
    () =>
      month.value.year * 12 + month.value.month <
      Number(todayKey.value.slice(0, 4)) * 12 + Number(todayKey.value.slice(5, 7)),
  );
  const canGoNextYear = computed(() => year.value < todayYear.value);

  const trackers = computed(() => document.value?.trackers ?? []);
  const daily = computed(() => (document.value ? dailyTrackers(document.value) : []));
  const day = computed(() =>
    document.value ? getDay(document.value, selectedDate.value) : createEmptyDay(),
  );
  const progress = computed(() =>
    document.value ? dayProgress(document.value, selectedDate.value) : { filled: 0, total: 0 },
  );
  const openedTracker = computed(
    () => document.value?.trackers.find((tracker) => tracker.id === openedId.value) ?? null,
  );
  const yearCellsSignal = computed(() =>
    document.value && openedId.value ? yearCells(document.value, openedId.value, year.value) : [],
  );
  const monthCellsSignal = computed(() =>
    document.value && openedId.value
      ? monthCells(document.value, openedId.value, month.value.year, month.value.month)
      : [],
  );
  const monthCounts = computed(() =>
    document.value && openedId.value
      ? optionCounts(
          document.value,
          openedId.value,
          `${String(month.value.year).padStart(4, "0")}-${String(month.value.month).padStart(2, "0")}`,
        )
      : { byOption: {}, unknown: 0 },
  );
  const habitBoard = computed(() =>
    layoutBoard(
      document.value && openedTracker.value?.kind === "habits"
        ? monthBoardItems(
            document.value,
            openedTracker.value.id,
            month.value.year,
            month.value.month,
          )
        : [],
    ),
  );
  const habitDays = computed(() =>
    document.value && openedTracker.value?.kind === "habits"
      ? pickCountsOfMonth(
          document.value,
          openedTracker.value.id,
          month.value.year,
          month.value.month,
        )
      : [],
  );
  const yearCounts = computed(() =>
    document.value && openedId.value
      ? optionCounts(document.value, openedId.value, String(year.value))
      : { byOption: {}, unknown: 0 },
  );
  const sheetPicks = computed(() => {
    const key = sheetDate.value;
    return key && openedId.value && document.value
      ? (getDay(document.value, key).marks[openedId.value] ?? [])
      : [];
  });
  const previews = computed(() => {
    const doc = document.value;
    return doc
      ? Object.fromEntries(
          doc.trackers
            .filter((tracker) => tracker.kind === "choice")
            .map((tracker) => [tracker.id, recentCells(doc, tracker.id, todayKey.value, 14)]),
        )
      : {};
  });
  const yearDays = computed(() => {
    const doc = document.value;
    const period = String(todayYear.value);
    return doc
      ? Object.fromEntries(
          doc.trackers.map((tracker) => [
            tracker.id,
            tracker.kind === "log"
              ? doc.logItems.filter(
                  (item) => item.trackerId === tracker.id && item.date.startsWith(period),
                ).length
              : markedDays(doc, tracker.id, period),
          ]),
        )
      : {};
  });
  const logTrackers = computed(() => trackers.value.filter((tracker) => tracker.kind === "log"));
  const dayLogItems = computed(() => {
    const doc = document.value;
    return doc
      ? Object.fromEntries(
          logTrackers.value.map((tracker) => [
            tracker.id,
            logItemsOf(doc, tracker.id).filter((item) => item.date === selectedDate.value),
          ]),
        )
      : {};
  });
  const openedLogItems = computed(() =>
    document.value && openedTracker.value?.kind === "log"
      ? logItemsOf(document.value, openedTracker.value.id).toReversed()
      : [],
  );
  const summary = computed(() =>
    document.value ? summarize(document.value) : { days: 0, marks: 0, logItems: 0 },
  );
  const reminder = computed(() =>
    backupReminder(lastExportedAt.value, summary.value.marks + summary.value.logItems, now()),
  );

  // Writes run strictly one after another, so an older version can never land after a newer one.
  let saveChain: Promise<void> = Promise.resolve();
  function queueSave(doc: AppDocument): void {
    saveChain = saveChain.then(() =>
      repository.save(doc).then(
        () => {
          saveFailed.value = false;
        },
        () => {
          saveFailed.value = true;
        },
      ),
    );
  }

  function change(operation: (doc: AppDocument) => AppDocument): void {
    const current = document.value;
    if (!current) {
      return;
    }
    const next = operation(current);
    if (next === current) {
      return;
    }
    document.value = next;
    queueSave(next);
  }

  return {
    status,
    loadError,
    saveFailed,
    selectedDate,
    todayKey,
    isToday,
    canGoNext,
    trackers,
    daily,
    day,
    progress,
    openedTracker,
    year,
    canGoNextYear,
    yearCells: yearCellsSignal,
    yearCounts,
    month,
    canGoNextMonth,
    monthCells: monthCellsSignal,
    monthCounts,
    habitBoard,
    habitDays,
    sheetDate,
    sheetPicks,
    previews,
    yearDays,
    logTrackers,
    dayLogItems,
    openedLogItems,
    lastExportedAt,
    backupReminder: reminder,
    summary,
    pendingImport,
    importError,

    async load() {
      try {
        const result = await repository.load();
        if (result.ok) {
          document.value = result.value;
          lastExportedAt.value = await repository
            .loadMeta()
            .then((meta) => meta.lastExportedAt)
            .catch(() => null);
          status.value = "ready";
        } else {
          loadError.value = result.error;
          status.value = "error";
        }
      } catch {
        loadError.value = { code: "storage-unavailable" };
        status.value = "error";
      }
    },

    selectDate(dateKey) {
      if (isDateKey(dateKey) && dateKey <= todayKey.value) {
        selectedDate.value = dateKey;
      }
    },

    previousDay() {
      selectedDate.value = addDays(selectedDate.value, -1);
    },

    nextDay() {
      if (canGoNext.value) {
        selectedDate.value = addDays(selectedDate.value, 1);
      }
    },

    goToToday() {
      selectedDate.value = todayKey.value;
    },

    syncToday() {
      const current = toDateKey(now());
      if (current === todayKey.value) {
        return;
      }
      const followToday = isToday.value;
      todayKey.value = current;
      if (followToday) {
        selectedDate.value = current;
      }
    },

    openTracker(trackerId) {
      if (trackers.value.some((tracker) => tracker.id === trackerId)) {
        openedId.value = trackerId;
        year.value = todayYear.value;
        month.value = {
          year: todayYear.value,
          month: Number(todayKey.value.slice(5, 7)),
        };
        sheetDate.value = null;
      }
    },

    closeTracker() {
      openedId.value = null;
      sheetDate.value = null;
    },

    previousMonth() {
      month.value = shiftMonth(month.value.year, month.value.month, -1);
    },

    nextMonth() {
      if (canGoNextMonth.value) {
        month.value = shiftMonth(month.value.year, month.value.month, 1);
      }
    },

    previousYear() {
      year.value -= 1;
    },

    nextYear() {
      if (canGoNextYear.value) {
        year.value += 1;
      }
    },

    openDay(dateKey) {
      if (isDateKey(dateKey) && dateKey <= todayKey.value) {
        sheetDate.value = dateKey;
      }
    },

    closeDay() {
      sheetDate.value = null;
    },

    toggleChoice(trackerId, optionId, dateKey = selectedDate.value) {
      change((doc) => toggleChoice(doc, dateKey, trackerId, optionId));
    },

    toggleHabit(trackerId, optionId, dateKey = selectedDate.value) {
      change((doc) => toggleHabit(doc, dateKey, trackerId, optionId));
    },

    setNote(note) {
      change((doc) => setNote(doc, selectedDate.value, note));
    },

    createTracker(draft) {
      const current = document.value;
      if (!current) {
        return null;
      }
      const id = newId("trk");
      const next = addTracker(current, {
        id,
        title: draft.title,
        icon: draft.icon,
        kind: draft.kind,
        view: draft.view,
        options: draft.options.map((option) => ({ id: newId("opt"), ...option })),
      });
      if (next === current) {
        return null;
      }
      change(() => next);
      return id;
    },

    updateTracker(trackerId, patch) {
      change((doc) => updateTracker(doc, trackerId, patch));
    },

    deleteTracker(trackerId) {
      change((doc) => deleteTracker(doc, trackerId));
    },

    moveTracker(trackerId, delta) {
      change((doc) => moveTracker(doc, trackerId, delta));
    },

    addOption(trackerId, draft) {
      change((doc) => addOption(doc, trackerId, { id: newId("opt"), ...draft }));
    },

    updateOption(trackerId, optionId, patch) {
      change((doc) => updateOption(doc, trackerId, optionId, patch));
    },

    deleteOption(trackerId, optionId) {
      change((doc) => deleteOption(doc, trackerId, optionId));
    },

    moveOption(trackerId, optionId, delta) {
      change((doc) => moveOption(doc, trackerId, optionId, delta));
    },

    trackerUsage(trackerId) {
      const doc = document.value;
      return doc
        ? {
            days: markedDays(doc, trackerId, ""),
            items: doc.logItems.filter((item) => item.trackerId === trackerId).length,
          }
        : { days: 0, items: 0 };
    },

    optionDays(trackerId, optionId) {
      const doc = document.value;
      return doc ? optionUsage(doc, trackerId, optionId) : 0;
    },

    addLogItem(trackerId, draft) {
      change((doc) => addLogItem(doc, { id: newId("log"), trackerId, ...draft }));
    },

    updateLogItem(itemId, patch) {
      change((doc) => updateLogItem(doc, itemId, patch));
    },

    deleteLogItem(itemId) {
      change((doc) => deleteLogItem(doc, itemId));
    },

    addPresets(keys) {
      const chosen = PRESETS.filter((preset) => keys.includes(preset.key));
      change((doc) =>
        chosen.reduce(
          (next, preset) => addTracker(next, createTrackerFromPreset(preset, newId)),
          doc,
        ),
      );
    },

    async exportBackup() {
      const current = document.value;
      if (!current) {
        return "failed";
      }
      try {
        const outcome = await exportDocument(current, now(), deps.exportEnv);
        if (outcome !== "cancelled") {
          const exportedAt = now().toISOString();
          lastExportedAt.value = exportedAt;
          await repository.saveMeta({ lastExportedAt: exportedAt }).catch(() => undefined);
        }
        return outcome;
      } catch {
        return "failed";
      }
    },

    readImport(text) {
      const result = parseImportFile(text);
      if (result.ok) {
        importError.value = null;
        pendingImport.value = { incoming: result.value, summary: summarize(result.value) };
      } else {
        pendingImport.value = null;
        importError.value = result.error;
      }
    },

    async confirmImport(mode) {
      const pending = pendingImport.value;
      pendingImport.value = null;
      if (!pending) {
        return;
      }
      // Let pending saves land first, so the snapshot and the merge see the latest data.
      await saveChain;
      const current = document.value;
      if (!current) {
        return;
      }
      try {
        document.value = await importDocument(repository, current, pending.incoming, mode);
        saveFailed.value = false;
      } catch {
        saveFailed.value = true;
      }
    },

    cancelImport() {
      pendingImport.value = null;
      importError.value = null;
    },

    whenSaved() {
      return saveChain;
    },
  };
}

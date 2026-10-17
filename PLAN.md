# Day Reflection: Implementation Plan

## Where we are

**Phase 1 (done, never deployed):** a checklist-style day log with an evening review. Milestones 0 to 5 built the whole foundation: scaffold and safety net, storage layer, store, UI primitives, backup export/import, settings, PWA with offline support, and a warm design. 235 tests pass.

**Phase 2 (this plan): a bullet-journal tracker app.** The app changes completely. Instead of a checklist per day, the user keeps **trackers**: a weather tracker, a stress tracker, a sleep ring, a shower ring, a dream tracker, a star rating per day, a movie review list, and a Tetris-style habit board, like the ones in the reference images. The architecture stays: `ui → state → storage → domain`, the same tooling, the same rules.

## What the reference images show

Twelve screenshots from bullet-journal videos (two of them show the same pages again). They boil down to **one idea with several drawings**:

| Page            | What it is                                                                                                                                | Kind   | View         |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------ |
| Weather tracker | Year grid: months J to D across, days 1 to 31 down. Each day gets one weather color, the legend has an icon per option                    | choice | year squares |
| Stress tracker  | Same grid. Legend: extreme, high, medium, low, none                                                                                       | choice | year squares |
| Today's rating  | Same grid. Legend: 1 to 5 stars as five purple/pink shades                                                                                | choice | year squares |
| Period tracker  | Same grid. Legend: none, spotting, light, medium, heavy flow                                                                              | choice | year squares |
| Dream tracker   | Same grid, but small circles instead of squares. Legend: can't remember, happy, funny, weird, sad, scary, nightmare                       | choice | year dots    |
| Sleep tracker   | A **ring** of 31 segments for one month, colored by hours slept (six buckets)                                                             | choice | month ring   |
| Shower tracker  | A ring, legend: none, quick wash, shower, bath, bubble bath, everything shower                                                            | choice | month ring   |
| Steps tracker   | One paw print per day, colored by step range (four buckets). On the page the prints are placed by hand along a path                       | choice | month stamps |
| Movie review    | A list: date, title, star ranking                                                                                                         | log    | list         |
| Adultris        | A Tetris board. Each finished habit adds a block in its own shape and color. Habits: tidy desk, take out trash, wash dishes, laundry, ... | habits | board        |

Details worth copying:

- A page always has a **legend**: a color (and often a small icon) per option.
- Days that do not exist (Feb 30) are filled in a muted tone.
- Colors are hand-picked on paper. In the app each option gets a color from a palette. (The subagents' hex guesses from the screenshots were unreliable, so the palette is chosen on purpose, not read off the images.)
- The user wants to **see the whole year or month at a glance** and fill in **today** quickly.
- The steps page is illustration, not data: paw positions are artistic. The app uses a regular grid of stamps, with the same colors and legend.

Your original needs fit in: "washed hair" and "washing machine" become the shower tracker and the habit board. The mood in the evening review becomes the "Today's rating" tracker.

## Concept

A **tracker** has a title, an icon (Material Symbols, picked from a grid), a **kind** (what you record each day) and a **view** (how it is drawn).

| Kind     | What you record                                  | Allowed views                                     |
| -------- | ------------------------------------------------ | ------------------------------------------------- |
| `choice` | One option from the legend per day               | year squares, year dots, month ring, month stamps |
| `habits` | Any number of habits per day (each with a shape) | board                                             |
| `log`    | A list of items: date, title, 1 to 5 stars, note | list                                              |

The **legend** is a list of options. Each option has a label, a color, an optional icon, and for habits a block shape. Everything is user-editable: trackers, options, colors, order.

## Screens

Bottom tab bar with three tabs:

1. **Heute** (today). One card per tracker. A choice tracker shows its legend as colored chips: tap one to set today, tap again to clear. A habit tracker shows chips you can switch on and off. A log tracker has "Eintrag hinzufügen". Trackers still empty today are marked open. The header shows "5 von 8 ausgefüllt". The date can be moved back (Vortag, Zu heute) to fill in a day you forgot. Notes are an own tracker (preset **Notizen**, a log tracker with date and text), not a field on this screen.
2. **Trackers.** An overview list. Each tracker is a card with a small preview of its view. Tap a card to open the full tracker: the year grid, the month ring, the board or the list, plus its legend with counts ("Sonnig: 120 Tage") and year or month navigation. Tapping a day cell opens a bottom sheet to set or change that day.
3. **Einstellungen.** Create a tracker from a preset or from scratch, edit titles, options and colors, reorder, delete (with confirmation). Backup export and import and the last-export reminder: unchanged from phase 1.

## Data model (schema version 2)

```json
{
  "version": 2,
  "trackers": [
    {
      "id": "trk_1",
      "title": "Wetter",
      "icon": "🌤️",
      "kind": "choice",
      "view": "year-squares",
      "options": [
        { "id": "opt_1", "label": "Sonnig", "color": "#f6c945", "icon": "☀️" },
        { "id": "opt_2", "label": "Regen", "color": "#55b4e8", "icon": "🌧️" }
      ]
    }
  ],
  "days": {
    "2026-10-17": {
      "marks": { "trk_1": ["opt_1"], "trk_habits": ["opt_a", "opt_b"] },
      "note": ""
    }
  },
  "logItems": [
    {
      "id": "log_1",
      "trackerId": "trk_movies",
      "date": "2026-10-17",
      "title": "Wicked",
      "rating": 4,
      "note": ""
    }
  ]
}
```

Decisions behind it:

- **Marks are always a list of option ids.** A choice tracker has at most one, a habit tracker any number. One shape keeps validation, merge and storage simple. The domain operations enforce the "at most one".
- **Days stay keyed by local `YYYY-MM-DD`** and empty days are still pruned, like in phase 1.
- **Marks reference options by id.** Recoloring or renaming an option changes the past, which is what you want for a legend. Deleting an option that is in use asks first and shows how many days it affects. Those days then show as gray "unbekannt" cells. Nothing is deleted behind your back.
- **Deleting a tracker** removes its marks and log items, after a confirmation that names the count and suggests an export first.
- **Unknown fields are still preserved** (`looseObject`). Colors are validated as `#rrggbb`.
- **No migration from version 1.** The app was never deployed, so there is no real v1 data. v2 replaces v1. The `migrate` machinery stays, with an empty table for the next change. A leftover v1 document in a test browser shows a clear "outdated version" error and is never overwritten.
- **Merge on import:** trackers and options are united by id (incoming wins), marks are merged per day and tracker (incoming wins on conflict, an empty incoming mark never erases), log items are united by id.

## Layers: what changes

The layers and rules stay. The content changes. A read-only audit of the code confirmed this split (41 test files and 235 tests today).

Concretely, **deleted**: the patterns `EntryRow`, `TemplatePicker`, `CategoryGroup`, `AddCategoryForm`, `CategoryEditRow`, `TemplateEditRow`, `LabeledCategoryForm`, `FreeEntryForm`, `MoodPicker`, `SummaryItem`, `DayListRow`; the features `ReviewView` and `HistoryView`; their tests; and the entry, category and template parts of `store.test.ts`, `selectors.test.ts`, `merge.test.ts` and the two App tests (rewritten for trackers).

**Small changes in otherwise generic code:** `summarize` and `ImportPreview` count days, marks and log items instead of days and entries. `merge.ts` and `schema.ts` are rewritten for v2. `i18n/de.ts` loses the `review`, `freeEntry`, `entry` and category strings and gains tracker strings. `ARCHITECTURE.md` gets new domain, folder and data-flow wording in T0. `DEPLOY.md` needs no change.

| Layer   | Removed                                                                     | Added                                                                                                                                                                                                                                                                                                              |
| ------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Domain  | entries, templates, categories, reflection, `operations.ts`, `structure.ts` | `trackers.ts` (tracker and option operations), `marks.ts` (set, clear, toggle), `logs.ts`, `calendar.ts` (days in month, year and month cells, invalid days), `habit-board.ts` (block layout), new selectors (open trackers, option counts), schema v2, v2 merge                                                   |
| Storage | nothing                                                                     | nothing (port, repository, backup and meta stay as they are)                                                                                                                                                                                                                                                       |
| State   | entry actions, review actions                                               | store with trackers, marks, log items, selected date and year or month, tracker editing actions, day note                                                                                                                                                                                                          |
| UI      | `DayView`, `ReviewView`, `HistoryView`, entry patterns                      | primitives: `ColorSwatch`, `ColorPalette`, `OptionChip`, `StarRating`, `BottomSheet`. Patterns: `TrackerCard`, `Legend`, `YearGrid`, `MonthRing`, `MonthStamps`, `HabitBoard`, `DaySheet`, `LogItemRow`, `OptionEditRow`, `TrackerPreview`. Features: `today`, `trackers`, `tracker-detail`, `settings` (extended) |

Kept as they are: `Button`, `TextField`, `TextArea`, `Select`, `Field`, `ToggleGroup`, `TabBar`, `Notice`, `FilePicker`, `ConfirmButton`, `DayHeader`, `DayNavigator`, the whole backup section, the PWA code, the repository and all storage adapters.

## Presets

Starter trackers the user can add with one tap, all editable afterwards. German labels, sample data only:

- **Wetter:** Sonnig, Bewölkt, Wolkig-heiter, Regen, Gewitter, Schnee, Nebel (year squares, with emoji icons)
- **Stress:** Extrem, Hoch, Mittel, Niedrig, Keiner (year squares)
- **Tagesbewertung:** 1 bis 5 Sterne in five shades (year squares)
- **Schlaf:** bis 4 h, 4 bis 6 h, 6 bis 8 h, 8 bis 10 h, 10 bis 12 h, 12+ h (month ring)
- **Duschen:** Nichts, Kurz abgewaschen, Dusche, Bad, Schaumbad, Alles-Dusche (month ring)
- **Traum:** Erinnere mich nicht, Glücklich, Lustig, Seltsam, Traurig, Gruselig, Albtraum (year dots)
- **Schritte:** 0 bis 3k, 3 bis 6k, 6 bis 9k, 9k+ (month stamps)
- **Filme:** log with stars
- **Haushalt-Board:** Schreibtisch, Müll, Geschirr, Spazieren, Bett, 2 l Wasser, Lesen, Wäsche (board)
- **Periode:** optional, listed like the others. It is health data, so it is never added by default. Data stays on the device and in your own exports.

## Design: bullet-journal paper

Replaces the coral theme of phase 1 but keeps the token structure, so it is still one file.

- **Paper:** warm cream background with a faint dot-grid pattern in CSS, white cards with thin, soft outlines like ruled boxes.
- **Handwritten titles** from fonts already on the iPhone (`"Bradley Hand"`, `"Noteworthy"`, then a generic cursive). No web font, so still no network calls.
- **Marker palette** as tokens: about 16 colors, pastel and saturated, chosen so neighbors are easy to tell apart. Used in swatches, grids, rings and the color picker.
- **Grids** with thin, soft cell borders, like the printed pages. Invalid days are filled in a muted tone.
- **Light only.** The app has no dark mode (decided at T7): one paper look, `color-scheme: light`, outlines in a soft warm gray (`--color-ink`) and `--color-strong` for selected states.
- **Accent** stays warm coral for buttons and the active tab.

## Milestones (phase 2)

Every milestone ends with `npm run check` green and, for UI, a check in headless Chrome at 390px, as before. Nothing is committed until you say so.

- **T0. Decisions and domain. Done.** All six open questions answered yes (defaults confirmed). Schema v2 with kind/view validation, presets (10), marker palette, `trackers.ts`, `marks.ts`, `logs.ts`, `calendar.ts`, `cells.ts`, selectors, v2 merge, a clear "outdated version" error for old files. The phase-1 checklist code is gone from `src/` (a copy sits in the git-ignored `.phase1-archive/` for reference until T7), and `App` is a placeholder until T1. 199 tests, including a year-long round trip through export, import and merge, and mutation checks on merge and the calendar. _Done when:_ a year of marks round-trips through export, import and merge in tests, and Feb 30 never produces a cell.
- **T1. Store, shell, and Today. Done.** `state/store.ts` (signals, ordered save queue, `saveFailed`, `syncToday`, picks, habits, day note, `addPresets`, export and import in two steps, backup reminder), tab bar Heute, Tracker, Einstellungen, paper design tokens (cream, dot grid, ink borders, handwriting titles, dark mode), `OptionChip`, `ColorSwatch`, `TrackerCard`, `PresetRow`, the Today screen (day navigation, "x von y ausgefüllt", "Offen" badge, note per day), the preset gallery on first start and in the settings, the settings with backup, and `LoadErrorView`. The Tracker tab is a plain list until T2. Log trackers (Filme) can be added but do not show on Today until T4. 244 tests, and the screens were checked at 390px in light and dark mode. _Done when:_ you can add the Wetter preset, set today's weather, move to yesterday, reload, and see it persisted (covered by an App test).
- **T2. Year views. Done.** `YearGrid` (squares and dots, 31 by 12, days that do not exist are dark and have no button), `Legend` with counts and a gray line for deleted options, `BottomSheet` and the day sheet, `OptionChips` (shared with Today), `TrackerPreview` (last 14 days), `TrackerListItem`, the Tracker overview and detail screen with year navigation (never past this year). New domain helpers `recentCells` and `markedDays`. Detail screens for month, habit and log trackers show a note that the view comes later (T3, T4, T6). Cells are about 28px wide at 390px. 268 tests, checked at 390px in light and dark mode with a seeded year. _Done when:_ a full year of weather shows as the grid, and tapping a cell edits that day.
- **T3. Month views. Done.** `domain/ring.ts` (pure arc geometry, tested for count, order, gaps, no overlap, finite numbers, large-arc flag), `domain/color.ts` (`readableInk`, black or white text with at least 4.5 to 1 on every palette color, tested), `weekdayOffset`, store month state (`previousMonth`, `nextMonth`, never past the current month), `MonthRing` (SVG, every segment a keyboard-operable button with a label), `MonthStamps` (calendar with paw prints, Monday first), month navigation and per-month legend counts. 295 tests, checked at 390px in light and dark mode, including keyboard focus on a ring segment. _Done when:_ the sleep ring and the stamp calendar look like the images and every segment is reachable by keyboard and screen reader.
- **T4. Log trackers. Done.** `StarRating` (five toggle buttons, tapping the current rating clears it to 0 = unrated), `DateField`, `LogItemRow`, `LogItemForm`, a `LogEditor` bottom sheet (add, edit, delete with a second tap, save disabled without a title or date), the `LogItems` list used on Today (items of the selected day) and in the tracker detail (all items, newest first, no year or legend). The overview counts entries ("2 Einträge"). Today hides the progress line when only list trackers exist. Store: `addLogItem`, `updateLogItem`, `deleteLogItem`, `logTrackers`, `dayLogItems`, `openedLogItems`. The sheet's close button is now neutral. 321 tests, checked at 390px in light and dark mode. _Done when:_ the movie list works, including a rating of 0 (unrated).
- **T5. Tracker editor. Done.** Settings now lists "Meine Tracker" (open, move up and down), "Eigener Tracker" (name, emoji, kind: Auswahl, Gewohnheiten or Liste, then straight into the editor), the preset gallery ("Tracker aus Vorlage") and the backup. The editor changes name, emoji and view as you type (a blank name is never saved), edits the legend (label, emoji, 20-color `ColorPalette` with spoken color names, reorder, add with the next unused color) and deletes. Deleting an option in use shows the number of days first and keeps those days as gray "Unbekannt"; the last option cannot be deleted; deleting a tracker names the days and list items that go away and needs a second tap. New: `DraftTextField`, `ColorPalette`, `OptionEditRow`, `TrackerEditRow`, store operations and `trackerUsage` and `optionDays`. The kind of a tracker is fixed after creation. Habit shapes come with T6. 356 tests, checked at 390px. _Done when:_ recoloring an option updates every past cell, and deleting an option in use turns those cells gray instead of losing them (both covered by App tests).
- **T6. Habit board. Done.** `domain/board.ts`: shapes with their orientations, `layoutBoard` (pure and deterministic: each habit done in the month drops as a block, oldest day first and in legend order; it picks the orientation and column with the fewest holes, then the lowest stack, with a stable hash as tie-break; the board is 10 wide and grows upward), `monthBoardItems`, `blockEdges` (outline of a block, so equal colors tell apart), `pickCountsOfMonth`. UI: `ShapeIcon` (used in chips, legend and editor), `HabitBoard` (SVG), `DayStrip` (days with habit counts, tap opens the day sheet), shape select in the option editor for habits. Habits of a deleted option fall as gray single squares. Property tests over 40 pseudo-random boards (no overlaps, nothing outside the board, every block whole and in a known orientation, every block rests on the floor or an earlier block, height equals the tallest column, same input gives the same board) plus mutation checks (ignoring occupied cells, no gravity) that fail 24 and 20 tests. 552 tests, checked at 390px in light and dark mode. Editing a past day re-runs the layout, so later blocks may move: the board is derived, never stored. _Done when:_ layout tests prove no overlaps, no blocks outside the board, and the same input always gives the same board.
- **T7. Polish. Done.** Light only (the dark theme and its media query are gone, `color-scheme: light`, one `theme-color`), softer outlines (`--color-ink` is now a warm gray, `--color-strong` marks selected states), new paper-style icon (a small colored grid, regenerated as 192, 512 and 180 px PNGs), `.phase1-archive/` deleted. Audited at 390px with a seeded year on every screen and every tracker detail: no horizontal overflow, every button and field is at least 44px except the 365 year-grid cells (the documented exception) and the checkbox inside a large preset row. The production build still loads offline after a reload (service worker). Docs and skill updated. _Done when:_ every view looks right in light mode and the known exceptions are written down.
- **T8. Deploy.** The old milestone 6 and `DEPLOY.md`: push, enable Pages, open on the iPhone, add to Home Screen, test export and import.

## Risks

- **Tap targets in grids.** A year grid has 12 columns at 390px, so cells are about 22px, below the 44px guideline. Dream-tracker dots are even smaller. Mitigation: the grid is for looking plus tap-to-open-sheet, the main way to fill in is the Today screen with big chips, and every cell has an `aria-label` ("17. Oktober: Sonnig"). A conscious exception.
- **Color as the only signal.** Mitigation: legend with text, the sheet shows the label, cells get an `aria-label`, and options can carry an emoji. Palette colors are picked to stay distinguishable.
- **Ring geometry.** 31 narrow segments are small touch targets and need correct arc math. Mitigation: pure geometry functions with tests, the same day sheet as everywhere else, keyboard-reachable segments.
- **Habit board layout.** A good-looking, deterministic placement is a small algorithm problem. Mitigation: property tests, and a plain fallback (fill row by row) if the packing does not look good.
- **Rendering 372 cell buttons per year.** Fine for Preact, but verify scrolling on the iPhone.
- **Data loss from storage eviction.** Unchanged: Home Screen install, export reminder, snapshot before import.
- **Service worker serving a stale app.** Unchanged: versioned cache name, "update available" notice.

## Decisions (all confirmed)

1. **Keep the evening review?** Default: **no**. The day note and the rating tracker replace it. Say so if you want the review screen (summary, reflection text, "finish the day") back.
2. **Which presets are on at first start?** Default: **none**. The first start shows a gallery where you tick the ones you want. Alternative: preload Haushalt-Board, Duschen, Tagesbewertung, Schlaf and Filme.
3. **Day note.** Replaced later by the **Notizen** tracker (several entries per day, date and text). Old day notes become entries when that tracker is added. Originally: one optional note per day, shown on Today. A note per tracker per day is possible but doubles the editing UI.
4. **Habit board in the first version?** Default: **yes, last** (T6). It is the most complex piece. It can be dropped without touching the rest.
5. **Steps tracker as numbers?** Default: **choose a range** (0 to 3k and so on), like on the page. Typing the step count and mapping it to a range could come later.
6. **No migration from phase 1.** Default: **drop it**, since nothing was deployed. Tell me if you have real data in a browser that must be kept.

## Constraints that still hold

| Constraint                                                           | Consequence                                                                                                                        |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| iOS Safari has no File System Access API                             | Browser storage is the working copy. Data moves by **export and import of a JSON file** through the share sheet and the Files app. |
| Safari may evict browser storage for sites not used for about 7 days | Install to the Home Screen, request persistent storage, show a "last exported" reminder. Exported files are the real backup.       |
| GitHub Pages sites are publicly reachable by URL                     | The repo is public on the Free plan and holds only code. **Data never goes into the repo.** Presets are fake sample data.          |

German UI, no sync between devices, GitHub Free plan: all unchanged. See `DEPLOY.md` for verified details.

## Appendix: phase 1 milestones (done)

0. Scaffold: Vite, Preact, TypeScript strict, Valibot, Vitest, Oxlint, Oxfmt, Husky, CI workflow.
1. Data layer: schema, parse, merge, `StoragePort` with memory and IndexedDB adapters, repository, backup.
2. Today view: operations, signals store with ordered save queue, primitives, patterns.
3. Evening review and history: tab bar, day navigation, review screen, history list.
4. Settings: categories, templates, export, import, last-export reminder.
5. PWA: manifest, icons, offline service worker with hashed cache name, update notice, persistent storage request.

---
name: day-reflection-app
description: Conventions for the Day Reflection app, a static single-page browser app that works like a bullet journal. The user keeps trackers (weather, stress, sleep ring, shower ring, dream dots, day rating, movie list, habit board) and fills in one colored cell per day. Use when building, changing, or debugging this app, its trackers and views, its JSON data format, its storage or export/import, or its GitHub Pages deployment.
---

# Day Reflection App

## Purpose

A personal, single-user bullet-journal tracker app. Each day the user opens it, taps one option per tracker (today's weather, stress level, how they slept, whether they showered, which habits they did) and later sees the whole year or month at a glance as a colored grid, ring or board. The goal is a clear picture of the days, not productivity pressure.

## Status

Phase 1, a checklist with an evening review, was built but never deployed and is gone. **Phase 2 is the tracker app described here.** `PLAN.md` holds the milestones T0 to T8. T0 to T7 are done: domain, store, the three tabs (Heute, Tracker, Einstellungen), preset gallery, year views, month ring and stamps, log trackers, tracker editor, habit board, and the polish pass (light-only design with soft outlines, new icon). Only the deploy (T8) remains. When the code and this file disagree, check `PLAN.md` for which milestone is current, and keep this file honest.

## Hard constraints

- Static site, no backend, no external network calls (so no web fonts, no CDN). Stack: TypeScript (strict), Preact with `@preact/signals`, Vite, Valibot, Vitest, Oxlint (type-aware) and Oxfmt. See `ARCHITECTURE.md`. It is the source of truth for layers, folders and component rules.
- Layers: `ui → state → storage → domain`. Imports go only to the right. Components never touch storage or mutate the document.
- Hosted on GitHub Pages, deployed by GitHub Actions. The repo contains code only, never the user's data. Presets are fake sample data.
- Primary device is an iPhone (Safari, added to Home Screen). Desktop browsers must work too.
- All user data lives in one JSON document. Structure (trackers, options, colors) and content (marks, log items) are both user-editable in the UI.
- UI text is German (`<html lang="de">`, German dates and labels). Keep all strings in `i18n/de.ts`. Code and identifiers stay English.
- No sync between devices. The repo is public (GitHub Free), so it must never contain personal data.
- Mobile first: safe-area insets respected, no hover-only features, tap targets of at least 44px. **One conscious exception:** cells in year grids and rings are small. They are for looking and tap-to-open, and the main way to fill in a day is the large chips on the Today screen. Every cell has an `aria-label`.

## Concepts

- **Tracker:** title, emoji, a `kind` and a `view`.
- **Kind** says what is recorded per day:
  - `choice`: one option from the legend per day (weather, stress, rating, sleep hours, shower, dream, steps, period).
  - `habits`: any number of habits per day, each with a block shape (the Tetris-style board).
  - `log`: a list of items with date, title, 1 to 5 stars and a note (movie review).
- **View** says how it is drawn: `year-squares`, `year-dots`, `month-ring`, `month-stamps` (all for `choice`), `board` (for `habits`), `list` (for `log`).
- **Option (legend entry):** id, label, color (`#rrggbb`), optional emoji icon, and for habits a shape.
- **Marks:** which options were picked on which day.

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
      "options": [{ "id": "opt_1", "label": "Sonnig", "color": "#f6c945", "icon": "☀️" }]
    }
  ],
  "days": {
    "2026-10-17": { "marks": { "trk_1": ["opt_1"] }, "note": "" }
  },
  "logItems": [
    {
      "id": "log_1",
      "trackerId": "trk_2",
      "date": "2026-10-17",
      "title": "Wicked",
      "rating": 4,
      "note": ""
    }
  ]
}
```

Rules:

- Day keys are local-date `YYYY-MM-DD`, never UTC-derived. Cells for days that do not exist (Feb 30, Feb 29 in a non-leap year) are never created and are drawn in a muted tone.
- Marks are always a list of option ids. A `choice` tracker holds at most one, and the domain operation enforces that. Empty days are pruned.
- Marks reference options by id. Recoloring or renaming an option changes the past on purpose. Deleting an option that is in use asks first, shows the number of affected days, and those days then show as gray "unbekannt" cells. Never drop marks silently.
- Deleting a tracker removes its marks and log items after a confirmation that names the count.
- A tracker must keep at least one option, except `log` trackers, which have none.
- IDs are opaque strings generated with `crypto.randomUUID()` and prefixed by type (`trk_`, `opt_`, `log_`).
- Every schema change bumps `version` and adds a pure `migrate(vN) -> vN+1` function. Import runs migrations and validates before replacing anything. There is no v1 to v2 migration, because v1 was never deployed.
- Unknown fields are preserved on load and save (`looseObject`).
- Import merge: trackers and options united by id (incoming wins), marks merged per day and tracker (incoming wins, an empty incoming mark never erases), log items united by id.
- The last-export time lives in the separate `meta` storage slot, not in the document.

## Storage layers (all behind one `storage` module, unchanged from phase 1)

1. Working copy: IndexedDB, written on every change, saves queued in order.
2. Backup/export: "Export" produces `day-reflection-YYYY-MM-DD.json`, delivered with `navigator.share({files})` where available (iOS share sheet, then "Save to Files"), otherwise a download.
3. Import: file picker, validate, show a summary (days, marks, log items), ask to replace or merge, and keep an automatic pre-import snapshot.

- Do not rely on `showSaveFilePicker` or other File System Access APIs. They are not available on iOS Safari.
- Treat browser storage as evictable. Show "last exported" in the UI and nudge the user when it is more than 7 days old.
- Offline: a service worker generated at build time, with a content-hashed cache name. A new version waits until the user taps "Neu laden".

## UI scope (phase 2)

- **Heute (today):** one card per tracker. `choice`: legend chips, tap to set, tap again to clear. `habits`: chips to switch on and off. `log`: "Eintrag hinzufügen". Open trackers are marked, the header shows how many are filled. Day navigation back in time, never past today. Notes are the preset `Notizen`: a `log` tracker with `entries: "text"` (date and text, no title or stars). There is no separate note field on Today. Adding that tracker turns old day notes (`days[date].note`) into entries and clears them (`adoptDayNotes`).
- **Trackers:** overview cards with a small preview. The detail screen shows the full view (year grid, month ring, stamps, board or list), the legend with counts, year or month navigation, and a bottom sheet to edit a tapped day.
- **Einstellungen:** create a tracker from a preset or from scratch, edit title, emoji, view and options (label, color, icon), reorder, delete. Export, import, last-export date.
- **First start:** a gallery of presets to tick. No tracker is preloaded. The period preset is never selected by default.
- **Design:** bullet-journal paper. Cream background with a faint dot grid, thin, soft cell borders, handwriting-style titles from fonts already on iOS (`"Bradley Hand"`, `"Noteworthy"`, then cursive), a marker palette of about 16 colors as tokens, coral accent. Light only, no dark mode. Outlines use the soft `--color-ink` token, selected states `--color-strong`.

## Working rules

- Do not add dependencies beyond those in `ARCHITECTURE.md` without asking. Pin exact versions.
- Components follow the three tiers (primitives, patterns, features), one folder each with a CSS module, a test and an `index.ts`. No `any`, no inline styles, no hard-coded UI strings. Colors come from the data (option colors, applied through CSS custom properties set per element) or from tokens, never hard-coded in components.
- **Adding a view:** put the pure geometry or layout in `domain` or next to the component as a plain function and test it first (cells for a month, ring arcs, board placement). Then build the pattern, which takes cells and callbacks as props and knows nothing about the store. Then wire it in the tracker detail feature and the preview.
- Geometry and layout functions must be deterministic and pure. The habit board is derived from the marks and is never stored.
- Before finishing any change, run `npm run check` (typecheck, lint, format check, tests). Never bypass the pre-commit hook.
- Never put real personal data in the repo, in fixtures, or in screenshots. Use obviously fake sample data.
- Test domain, storage and state logic in Vitest without a browser. Check every UI change at phone width (390px) in headless Chrome. The app is light only.
- Commit only when the user asks.
- Deployment steps live in `DEPLOY.md`, the implementation plan in `PLAN.md`, and the design in `ARCHITECTURE.md`. Keep them updated when behavior changes.

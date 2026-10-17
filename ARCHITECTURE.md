# Day Reflection: Architecture

## Stack

| Concern                 | Choice                            | Why                                                                                         |
| ----------------------- | --------------------------------- | ------------------------------------------------------------------------------------------- |
| Language                | TypeScript, strict                | Type safety across data, state and UI                                                       |
| UI                      | Preact + `@preact/signals`        | Tiny, React-style components, simple reactive state                                         |
| Build / dev server      | Vite                              | Fast, static output for GitHub Pages                                                        |
| Runtime data validation | Valibot                           | Types are derived from the schema, so the JSON format has one source of truth. Small bundle |
| Lint                    | Oxlint, type-aware                | Fast, with `react` and `jsx-a11y` rules                                                     |
| Format                  | Oxfmt (Biome is the fallback)     | Prettier-compatible, fast. Still beta                                                       |
| Tests                   | Vitest, `@testing-library/preact` | Same config as Vite. Pure logic is tested without a browser                                 |
| Git hooks               | Husky + lint-staged               | Checks run before commit                                                                    |
| CI/CD                   | GitHub Actions to GitHub Pages    | Deploys only if all checks pass                                                             |

Versions are pinned exactly in `package.json`. Add no dependency beyond this table without asking. `fake-indexeddb` is a test-only dependency, used to run the IndexedDB adapter in Vitest. Preact stays on 10.x because `@testing-library/preact` does not yet declare support for Preact 11. The layer rule is enforced by `no-restricted-imports` overrides in `.oxlintrc.json`.

## Layers and the dependency rule

```
ui  →  state  →  storage  →  domain
```

Each layer may import only from layers to its right. `domain` imports nothing from the app.

| Layer   | Folder        | Contains                                                                                                                                                                              | Knows about         |
| ------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Domain  | `src/domain`  | Types, Valibot schemas (version 2), `migrate`, `merge`, selectors, operations on trackers, marks and log items, calendar and cell helpers, presets, date helpers. Pure functions only | Nothing             |
| Storage | `src/storage` | `StoragePort` interface (slots `current`, `snapshot`, `meta`), IndexedDB adapter, in-memory adapter (tests), repository, export/import (`backup.ts`)                                  | Domain              |
| State   | `src/state`   | Signals store and its actions (set a mark, edit a tracker, export, import). Persists through `StoragePort`                                                                            | Domain, storage     |
| UI      | `src/ui`      | Components, no business logic                                                                                                                                                         | State, domain types |

Consequences:

- Components never call storage or mutate the data document directly. They read signals and call actions.
- The whole app, except rendering, runs in Node tests with the in-memory adapter.
- Swapping IndexedDB for another store, or adding sync later, means writing one new adapter.

## Folder structure

```
day-reflection/
  src/
    domain/        types.ts  schema.ts  migrate.ts  merge.ts  parse.ts  selectors.ts  cells.ts  calendar.ts  trackers.ts  marks.ts  logs.ts  presets.ts  palette.ts  dates.ts  fixtures.ts (test helpers)  *.test.ts
    storage/       port.ts  indexeddb.ts  memory.ts  backup.ts  *.test.ts
    state/         store.ts  store.test.ts
    i18n/          de.ts          (all UI strings, typed keys)
    ui/
      tokens.css                  (paper palette, light only, spacing, radii, shadows, safe-area as CSS variables)
      primitives/  Button/  Checkbox/  Field/  TextField/  TextArea/  Select/  ToggleGroup/  TabBar/  Notice/  FilePicker/  ConfirmButton/
      patterns/    DayHeader/  DayNavigator/  CategoryGroup/  EntryRow/  TemplatePicker/  FreeEntryForm/  MoodPicker/  SummaryItem/  DayListRow/  LabeledCategoryForm/  AddCategoryForm/  CategoryEditRow/  TemplateEditRow/  ImportPreview/
      features/    day/  review/  history/  load-error/  settings/
      App.tsx
    pwa/           register.ts  persist.ts  *.test.ts   (service worker registration, persistent-storage request; used by main.tsx only)
    main.tsx
  public/          manifest.webmanifest  icon.svg  icon-192.png  icon-512.png  apple-touch-icon.png
  tools/           service-worker.ts  sw.template.js  *.test.ts   (build plugin that writes dist/sw.js)
  index.html
  .github/workflows/deploy.yml
```

## Component rules (the reusable part)

1. **Three tiers.**
   - `primitives`: generic building blocks. They know nothing about trackers, days or the data model. Props are plain values and callbacks.
   - `patterns`: small compositions of primitives, and of other patterns, for this domain, such as a tracker card or a year grid. They take domain types as props, not the store. Patterns must not depend on each other in a cycle.
   - `features`: screens. Only features and `App` read signals or call actions.
2. **One folder per component:** `Name.tsx`, `Name.module.css`, `Name.test.tsx`, and `index.ts` that exports the component and its props type.
3. **Typed props, no `any`, no inline styles.** Styling uses CSS modules and the variables from `tokens.css`, so theming lives in one place.
4. **Accessible by default.** Real `<button>`, `<input>` and `<label>` elements, a visible focus state, 44px minimum tap targets. `jsx-a11y` lint rules enforce the basics.
5. **No strings in components.** Text comes from `i18n/de.ts`, or from props for primitives.
6. **A new primitive needs at least two uses or a clear reason.** Do not build components ahead of demand. Extract a pattern when the same JSX appears a second time.
7. Each primitive gets a test that checks its role, label and callback behavior.

## Where tracker data lives

- Trackers (with their legends), marks, day notes and log items are all part of the document, so they travel with every export and import.
- The time of the last export is **not** part of the document. It lives in the `meta` slot, so a backup never contains a stale "last exported" value.
- Marks refer to options by id. Recoloring or renaming an option changes how the past is drawn, on purpose. Deleting an option keeps the marks: those days show as "unknown". Deleting a tracker removes its marks and log items, after a confirmation.
- Grids, rings and the habit board are **derived** from the marks by pure functions (`cells.ts`, `calendar.ts`, later the board layout). The drawing is never stored.
- Days that do not exist (Feb 30) never get a date key and never a cell.
- Text fields in the editors apply on blur, not per keystroke. A blank title or label is rejected by the domain, and the field resets.

## Offline and updates (PWA)

- `tools/service-worker.ts` is a Vite plugin. After the build it lists every file in `dist/`, hashes names and contents into a version, and writes `dist/sw.js` from `tools/sw.template.js`. The cache is named `day-reflection-<version>`, so each deploy gets a fresh cache, and old caches are deleted on activation.
- The worker is cache-first for same-origin GETs with `ignoreVary` (module scripts send an `Origin` header, and a `Vary: Origin` response would otherwise make every lookup miss). Offline navigations fall back to the cached `index.html`.
- A new version never takes over by itself. It waits, `register.ts` exposes `update.available`, `App` shows a notice, and "Neu laden" sends `SKIP_WAITING` and reloads. The app also checks for a new version whenever it returns to the foreground.
- The worker is registered only in production builds (`import.meta.env.PROD`).
- After loading, the app calls `navigator.storage.persist()`. Whether iOS honours it is unverified.

## Data flow

1. App start: `storage.load()` → `migrate` → `validate` (Valibot) → fill the store signals.
2. User action: component → action → pure domain function returns the new document → store updates the signal → `storage.save()` (debounced) → UI re-renders.
3. Import: parse file → `migrate` → `validate` → show summary → snapshot current data → replace or merge → save.
4. Export: serialize the document → `navigator.share({files})`, falling back to a download.
   Invalid data never reaches the store. A failed load or import shows a German error and leaves existing data untouched.

## TypeScript and lint settings

- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `noImplicitOverride`.
- Oxlint with type-aware rules on, plus the `react`, `jsx-a11y`, `import` and `unicorn` plugins where useful. `no-explicit-any` and `no-floating-promises` are errors.
- Enforce the layer rule with an import restriction, for example `domain` may not import `storage`, `state` or `ui`.

## Scripts

| Script                    | Runs                                |
| ------------------------- | ----------------------------------- |
| `dev`                     | Vite dev server                     |
| `typecheck`               | `tsc --noEmit`                      |
| `lint`                    | `oxlint --type-aware`               |
| `format` / `format:check` | `oxfmt` / `oxfmt --check`           |
| `test`                    | `vitest run`                        |
| `check`                   | typecheck, lint, format:check, test |
| `build`                   | `vite build` to `dist/`             |

## Safety net

- **Pre-commit (Husky + lint-staged):** format and lint staged files, then `typecheck` and the tests related to the changes.
- **CI (`deploy.yml`):** job `check` runs `npm ci` and `npm run check`. Job `build` runs only if `check` passes and uploads `dist/`. Job `deploy` publishes to Pages.
- Pull requests run `check` only. Deploy runs on push to `main`.

## Future extension points

- **Sync:** add a second `StoragePort` adapter. The domain `merge` function already exists for imports.
- **New fields or features:** bump the schema `version`, add a `migrate` step, and extend the Valibot schema. Types follow automatically.
- **More languages:** add `en.ts` next to `de.ts` and pick one at start-up.
- **E2E tests:** add Playwright later, run against the built `dist/`.

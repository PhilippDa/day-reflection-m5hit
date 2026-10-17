import { fireEvent, render, screen, within } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { createStore } from "../state/store";
import { createMemoryPort } from "../storage/memory";
import type { StoragePort } from "../storage/port";
import { createRepository } from "../storage/repository";
import { App } from "./App";
import { StoreProvider } from "./StoreContext";

function setup(port: StoragePort = createMemoryPort()) {
  const repository = createRepository(port);
  let counter = 0;
  const store = createStore({
    repository,
    now: () => new Date(2026, 9, 17, 20, 0),
    newId: (prefix) => `${prefix}_${String((counter += 1))}`,
  });
  const view = render(
    <StoreProvider store={store}>
      <App />
    </StoreProvider>,
  );
  return { store, port, view };
}

async function addPresets(...names: string[]) {
  for (const name of names) {
    fireEvent.click(screen.getByRole("checkbox", { name: new RegExp(name) }));
  }
  fireEvent.click(screen.getByRole("button", { name: /hinzufügen$/ }));
}

describe("App", () => {
  it("shows a loading state, then the preset gallery on the first start", async () => {
    const { store } = setup();
    expect(screen.getByRole("status").textContent).toBe("Lade …");
    await store.load();
    expect(
      await screen.findByRole("heading", { level: 1, name: "Womit möchtest du starten?" }),
    ).toBeTruthy();
    // Nothing is preselected, and the add button waits for a choice.
    for (const box of screen.getAllByRole<HTMLInputElement>("checkbox")) {
      expect(box.checked).toBe(false);
    }
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Tracker auswählen" }).disabled,
    ).toBe(true);
    expect(screen.getByRole("checkbox", { name: /Periode/ })).toBeTruthy();
    expect(screen.getByText(/Gesundheitsdaten/)).toBeTruthy();
  });

  it("adds a preset, picks today's weather, visits yesterday, and keeps it after a reload", async () => {
    const { store, port, view } = setup();
    await store.load();
    await screen.findByRole("heading", { level: 1, name: "Womit möchtest du starten?" });

    await addPresets("Wetter");
    expect(await screen.findByRole("heading", { level: 1, name: "Heute" })).toBeTruthy();
    expect(screen.getByText("Samstag, 17. Oktober 2026")).toBeTruthy();
    expect(screen.getByText("0 von 1 ausgefüllt")).toBeTruthy();
    expect(screen.getByText("Offen")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Sonnig/ }));
    expect(screen.getByRole("button", { name: /Sonnig/ }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByText("1 von 1 ausgefüllt")).toBeTruthy();
    expect(screen.queryByText("Offen")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Vortag/ }));
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Freitag, 16. Oktober 2026");
    expect(screen.getByRole("button", { name: /Sonnig/ }).getAttribute("aria-pressed")).toBe(
      "false",
    );
    fireEvent.click(screen.getByRole("button", { name: /Regen/ }));

    await store.whenSaved();
    view.unmount();

    const reloaded = setup(port);
    await reloaded.store.load();
    expect(await screen.findByRole("heading", { level: 1, name: "Heute" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Sonnig/ }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: /Vortag/ }));
    expect(screen.getByRole("button", { name: /Regen/ }).getAttribute("aria-pressed")).toBe("true");
  });

  it("clears a pick with a second tap", async () => {
    const { store } = setup();
    await store.load();
    await screen.findByRole("heading", { level: 1, name: "Womit möchtest du starten?" });
    await addPresets("Wetter");
    fireEvent.click(await screen.findByRole("button", { name: /Sonnig/ }));
    fireEvent.click(screen.getByRole("button", { name: /Sonnig/ }));
    expect(screen.getByRole("button", { name: /Sonnig/ }).getAttribute("aria-pressed")).toBe(
      "false",
    );
    expect(screen.getByText("0 von 1 ausgefüllt")).toBeTruthy();
  });

  it("switches several habits on one day", async () => {
    const { store } = setup();
    await store.load();
    await screen.findByRole("heading", { level: 1, name: "Womit möchtest du starten?" });
    await addPresets("Haushalt");
    const card = await screen.findByRole("region", { name: /Haushalt/ });
    const [first, second] = within(card).getAllByRole("button");
    if (!first || !second) {
      throw new Error("habit chips missing");
    }
    fireEvent.click(first);
    fireEvent.click(second);
    expect(first.getAttribute("aria-pressed")).toBe("true");
    expect(second.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("1 von 1 ausgefüllt")).toBeTruthy();
  });

  it("has no plain note field on Today anymore", async () => {
    const { store } = setup();
    await store.load();
    await screen.findByRole("heading", { level: 1, name: "Womit möchtest du starten?" });
    await addPresets("Wetter");
    await screen.findByRole("region", { name: /Wetter/ });
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("navigates between the three tabs and adds trackers from settings", async () => {
    const { store } = setup();
    await store.load();
    await screen.findByRole("heading", { level: 1, name: "Womit möchtest du starten?" });
    await addPresets("Wetter");
    await screen.findByRole("heading", { level: 1, name: "Heute" });

    fireEvent.click(screen.getByRole("button", { name: "Tracker" }));
    expect(screen.getByRole("heading", { level: 1, name: "Tracker" })).toBeTruthy();
    expect(screen.getByText("Wetter")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Einstellungen" }));
    expect(screen.getByRole("heading", { level: 1, name: "Einstellungen" })).toBeTruthy();
    // The weather preset is taken, so it is no longer offered.
    expect(screen.queryByRole("checkbox", { name: /Wetter/ })).toBeNull();
    await addPresets("Stress");

    fireEvent.click(screen.getByRole("button", { name: "Heute" }));
    expect(screen.getByRole("region", { name: /Stress/ })).toBeTruthy();
    expect(screen.getByText("0 von 2 ausgefüllt")).toBeTruthy();
  });

  it("shows a clear error for data of the old checklist app", async () => {
    const port = createMemoryPort();
    await port.write("current", { version: 1, categories: [] });
    const { store } = setup(port);
    await store.load();
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText(/älteren App-Version/)).toBeTruthy();
  });

  it("offers a backup in the settings and reminds about it once something is recorded", async () => {
    const { store } = setup();
    await store.load();
    await screen.findByRole("heading", { level: 1, name: "Womit möchtest du starten?" });
    await addPresets("Wetter");
    expect(screen.queryByText(/noch keine Sicherung/)).toBeNull();
    fireEvent.click(await screen.findByRole("button", { name: /Sonnig/ }));
    expect(screen.getByText(/noch keine Sicherung/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Jetzt sichern" }));
    expect(screen.getByRole("heading", { level: 1, name: "Einstellungen" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sicherung exportieren" })).toBeTruthy();
  });
});

async function openWeather() {
  const { store, port, view } = setup();
  await store.load();
  await screen.findByRole("heading", { level: 1, name: "Womit möchtest du starten?" });
  await addPresets("Wetter");
  fireEvent.click(await screen.findByRole("button", { name: /Sonnig/ }));
  fireEvent.click(screen.getByRole("button", { name: "Tracker" }));
  return { store, port, view };
}

describe("tracker detail", () => {
  it("lists trackers with how many days are filled in this year", async () => {
    await openWeather();
    expect(screen.getByRole("button", { name: /Wetter.*1 Tag eingetragen/ })).toBeTruthy();
  });

  it("shows the year as a grid, legend with counts, and goes back and forth between years", async () => {
    await openWeather();
    fireEvent.click(screen.getByRole("button", { name: /Wetter/ }));
    expect(screen.getByRole("heading", { level: 1, name: /Wetter/ })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Wetter 2026" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "17. Oktober: Sonnig" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "18. Oktober: nicht eingetragen" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /30\. Februar/ })).toBeNull();
    const legendRow = screen.getByText("☀️ Sonnig").closest("li");
    expect(legendRow?.textContent).toBe("☀️ Sonnig1");

    fireEvent.click(screen.getByRole("button", { name: /Vorjahr/ }));
    expect(screen.getByRole("region", { name: "Wetter 2025" })).toBeTruthy();
    expect(screen.getByText("☀️ Sonnig").closest("li")?.textContent).toBe("☀️ Sonnig0");
    fireEvent.click(screen.getByRole("button", { name: /Folgejahr/ }));
    expect(screen.getByRole<HTMLButtonElement>("button", { name: /Folgejahr/ }).disabled).toBe(
      true,
    );

    fireEvent.click(screen.getByRole("button", { name: "‹ Tracker" }));
    expect(screen.getByRole("heading", { level: 1, name: "Tracker" })).toBeTruthy();
  });

  it("edits a past day through the sheet and keeps it after a reload", async () => {
    const { store, port, view } = await openWeather();
    fireEvent.click(screen.getByRole("button", { name: /Wetter/ }));
    fireEvent.click(screen.getByRole("button", { name: "5. März: nicht eingetragen" }));

    const dialog = screen.getByRole("dialog", { name: "Donnerstag, 5. März 2026" });
    fireEvent.click(within(dialog).getByRole("button", { name: /Regen/ }));
    expect(within(dialog).getByRole("button", { name: /Regen/ }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Fertig" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "5. März: Regen" })).toBeTruthy();
    expect(screen.getByText("🌧️ Regen").closest("li")?.textContent).toBe("🌧️ Regen1");

    await store.whenSaved();
    view.unmount();
    const reloaded = setup(port);
    await reloaded.store.load();
    fireEvent.click(await screen.findByRole("button", { name: "Tracker" }));
    fireEvent.click(screen.getByRole("button", { name: /Wetter/ }));
    expect(screen.getByRole("button", { name: "5. März: Regen" })).toBeTruthy();
  });
});

async function openTracker(preset: string, name: RegExp) {
  const { store } = setup();
  await store.load();
  await screen.findByRole("heading", { level: 1, name: "Womit möchtest du starten?" });
  await addPresets(preset);
  fireEvent.click(await screen.findByRole("button", { name: "Tracker" }));
  fireEvent.click(screen.getByRole("button", { name }));
  return store;
}

describe("month views", () => {
  it("shows the sleep ring for a month and lets you pick a day in it", async () => {
    await openTracker("Schlaf", /Schlaf/);
    expect(screen.getByRole("region", { name: "Schlaf Oktober 2026" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Oktober: nicht eingetragen/ })).toHaveLength(31);

    fireEvent.click(screen.getByRole("button", { name: "17. Oktober: nicht eingetragen" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /6 bis 8 Stunden/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Fertig" }));
    expect(screen.getByRole("button", { name: "17. Oktober: 6 bis 8 Stunden" })).toBeTruthy();
    expect(screen.getByText("6 bis 8 Stunden").closest("li")?.textContent).toBe("6 bis 8 Stunden1");
  });

  it("moves between months, counts per month, and stops at the current month", async () => {
    await openTracker("Schlaf", /Schlaf/);
    fireEvent.click(screen.getByRole("button", { name: "17. Oktober: nicht eingetragen" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: /6 bis 8/ }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Fertig" }));

    expect(screen.getByRole<HTMLButtonElement>("button", { name: /Folgemonat/ }).disabled).toBe(
      true,
    );
    fireEvent.click(screen.getByRole("button", { name: /Vormonat/ }));
    expect(screen.getByRole("region", { name: "Schlaf September 2026" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /September: / })).toHaveLength(30);
    expect(screen.getByText("6 bis 8 Stunden").closest("li")?.textContent).toBe("6 bis 8 Stunden0");
    fireEvent.click(screen.getByRole("button", { name: /Folgemonat/ }));
    expect(screen.getByRole("region", { name: "Schlaf Oktober 2026" })).toBeTruthy();
  });

  it("shows the steps tracker as a calendar of stamps", async () => {
    await openTracker("Schritte", /Schritte/);
    expect(screen.getByRole("region", { name: "Schritte Oktober 2026" })).toBeTruthy();
    expect(screen.getByText(/^Mo\.?$/)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Oktober: nicht eingetragen/ })).toHaveLength(31);
  });
});

async function openMovies() {
  const { store, port, view } = setup();
  await store.load();
  await screen.findByRole("heading", { level: 1, name: "Womit möchtest du starten?" });
  await addPresets("Filme");
  return { store, port, view };
}

async function addMovie(title: string, stars: number) {
  fireEvent.click(screen.getByRole("button", { name: "Eintrag hinzufügen" }));
  const dialog = screen.getByRole("dialog", { name: "Neuer Eintrag" });
  fireEvent.input(within(dialog).getByLabelText("Titel"), { target: { value: title } });
  if (stars > 0) {
    fireEvent.click(within(dialog).getByRole("button", { name: `${String(stars)} Sterne` }));
  }
  fireEvent.click(within(dialog).getByRole("button", { name: "Speichern" }));
}

async function openNotes() {
  const { store } = setup();
  await store.load();
  await screen.findByRole("heading", { level: 1, name: "Womit möchtest du starten?" });
  await addPresets("Notizen");
  await screen.findByRole("region", { name: /Notizen/ });
}

describe("notes tracker", () => {
  it("adds a note with only a date and a text, and edits and deletes it", async () => {
    await openNotes();
    fireEvent.click(screen.getByRole("button", { name: "Eintrag hinzufügen" }));
    const dialog = screen.getByRole("dialog", { name: "Neuer Eintrag" });
    expect(within(dialog).queryByLabelText("Titel")).toBeNull();
    expect(within(dialog).queryByRole("group", { name: "Bewertung" })).toBeNull();
    const save = within(dialog).getByRole("button", { name: "Speichern" });
    expect(save.hasAttribute("disabled")).toBe(true);
    fireEvent.input(within(dialog).getByLabelText("Text"), {
      target: { value: "Spaziergang am See" },
    });
    fireEvent.click(save);
    expect(screen.queryByRole("dialog")).toBeNull();

    const row = screen.getByRole("button", { name: "Notiz bearbeiten: Samstag, 17. Oktober 2026" });
    expect(row.textContent).toContain("Spaziergang am See");
    fireEvent.click(row);
    const editor = screen.getByRole("dialog", { name: "Eintrag bearbeiten" });
    fireEvent.input(within(editor).getByLabelText("Text"), { target: { value: "Am Fluss" } });
    fireEvent.click(within(editor).getByRole("button", { name: "Speichern" }));
    expect(screen.getByText("Am Fluss")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Notiz bearbeiten/ }));
    const again = screen.getByRole("dialog");
    fireEvent.click(within(again).getByRole("button", { name: "Löschen" }));
    fireEvent.click(within(again).getByRole("button", { name: "Wirklich löschen" }));
    expect(screen.getByText("Noch keine Einträge.")).toBeTruthy();
  });
});

describe("log trackers", () => {
  it("shows a list card on Today without a misleading progress line", async () => {
    await openMovies();
    expect(await screen.findByRole("region", { name: /Filme/ })).toBeTruthy();
    expect(screen.getByText("Noch keine Einträge.")).toBeTruthy();
    expect(screen.queryByText(/ausgefüllt/)).toBeNull();
  });

  it("adds a movie with stars for today, and the sheet closes", async () => {
    await openMovies();
    await screen.findByRole("region", { name: /Filme/ });
    await addMovie("Wicked", 4);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Bearbeiten: Wicked, 4 von 5 Sternen" }),
    ).toBeTruthy();
  });

  it("does not save an entry without a title", async () => {
    await openMovies();
    await screen.findByRole("region", { name: /Filme/ });
    fireEvent.click(screen.getByRole("button", { name: "Eintrag hinzufügen" }));
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole<HTMLButtonElement>("button", { name: "Speichern" }).disabled,
    ).toBe(true);
    fireEvent.click(within(dialog).getByRole("button", { name: "Abbrechen" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("Noch keine Einträge.")).toBeTruthy();
  });

  it("keeps an unrated movie, edits it to a rating, then back to unrated", async () => {
    await openMovies();
    await screen.findByRole("region", { name: /Filme/ });
    await addMovie("Dune", 0);
    fireEvent.click(screen.getByRole("button", { name: "Bearbeiten: Dune, Nicht bewertet" }));
    let dialog = screen.getByRole("dialog", { name: "Eintrag bearbeiten" });
    fireEvent.click(within(dialog).getByRole("button", { name: "5 Sterne" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Speichern" }));
    fireEvent.click(screen.getByRole("button", { name: "Bearbeiten: Dune, 5 von 5 Sternen" }));
    dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "5 Sterne" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Speichern" }));
    expect(screen.getByRole("button", { name: "Bearbeiten: Dune, Nicht bewertet" })).toBeTruthy();
  });

  it("deletes a movie after a second tap", async () => {
    await openMovies();
    await screen.findByRole("region", { name: /Filme/ });
    await addMovie("Dune", 3);
    fireEvent.click(screen.getByRole("button", { name: /Bearbeiten: Dune/ }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Löschen" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Wirklich löschen" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByText("Dune")).toBeNull();
  });

  it("lists all movies newest first on the tracker screen and keeps them after a reload", async () => {
    const { store, port, view } = await openMovies();
    await screen.findByRole("region", { name: /Filme/ });
    await addMovie("Heute", 2);
    fireEvent.click(screen.getByRole("button", { name: /Vortag/ }));
    await addMovie("Gestern", 5);
    await store.whenSaved();
    view.unmount();

    const reloaded = setup(port);
    await reloaded.store.load();
    fireEvent.click(await screen.findByRole("button", { name: "Tracker" }));
    expect(screen.getByRole("button", { name: /Filme.*2 Einträge/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Filme/ }));
    const rows = screen.getAllByRole("button", { name: /^Bearbeiten: / });
    expect(rows.map((row) => row.getAttribute("aria-label"))).toEqual([
      "Bearbeiten: Heute, 2 von 5 Sternen",
      "Bearbeiten: Gestern, 5 von 5 Sternen",
    ]);
    expect(screen.queryByRole("heading", { name: "Legende" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Vorjahr/ })).toBeNull();
  });
});

function firstOf<T>(items: readonly T[]): T {
  const item = items[0];
  if (item === undefined) {
    throw new Error("nothing found");
  }
  return item;
}

async function startWithWeather() {
  const { store, port, view } = setup();
  await store.load();
  await screen.findByRole("heading", { level: 1, name: "Womit möchtest du starten?" });
  await addPresets("Wetter");
  await screen.findByRole("heading", { level: 1, name: "Heute" });
  fireEvent.click(screen.getByRole("button", { name: "Einstellungen" }));
  return { store, port, view };
}

describe("tracker editor", () => {
  it("lists trackers in the settings and opens one", async () => {
    await startWithWeather();
    fireEvent.click(screen.getByRole("button", { name: "Bearbeiten: Wetter" }));
    expect(screen.getByRole("heading", { level: 1, name: "Tracker bearbeiten" })).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>("Name").value).toBe("Wetter");
    expect(screen.getAllByLabelText("Bezeichnung")).toHaveLength(7);
    fireEvent.click(screen.getByRole("button", { name: "‹ Einstellungen" }));
    expect(screen.getByRole("heading", { level: 1, name: "Einstellungen" })).toBeTruthy();
  });

  it("renames the tracker and changes its view", async () => {
    await startWithWeather();
    fireEvent.click(screen.getByRole("button", { name: "Bearbeiten: Wetter" }));
    fireEvent.input(screen.getByLabelText("Name"), { target: { value: "Himmel" } });
    fireEvent.change(screen.getByLabelText("Ansicht"), { target: { value: "year-dots" } });
    fireEvent.click(screen.getByRole("button", { name: "‹ Einstellungen" }));
    expect(screen.getByRole("button", { name: "Bearbeiten: Himmel" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Tracker" }));
    expect(screen.getByRole("button", { name: /Himmel/ })).toBeTruthy();
  });

  it("recoloring an option changes every past cell", async () => {
    const { store } = await startWithWeather();
    fireEvent.click(screen.getByRole("button", { name: "Heute" }));
    fireEvent.click(screen.getByRole("button", { name: /Sonnig/ }));
    store.selectDate("2026-10-10");
    fireEvent.click(screen.getByRole("button", { name: /Sonnig/ }));

    fireEvent.click(screen.getByRole("button", { name: "Einstellungen" }));
    fireEvent.click(screen.getByRole("button", { name: "Bearbeiten: Wetter" }));
    const firstRow = screen.getByRole("region", { name: "Sonnig" });
    fireEvent.click(within(firstRow).getByRole("button", { name: "Lila" }));

    fireEvent.click(screen.getByRole("button", { name: "Tracker" }));
    fireEvent.click(screen.getByRole("button", { name: /Wetter/ }));
    for (const day of ["17. Oktober: Sonnig", "10. Oktober: Sonnig"]) {
      expect(screen.getByRole("button", { name: day }).getAttribute("style")).toContain("#7b5ea7");
    }
  });

  it("deleting an option in use warns first and turns its days gray, not lost", async () => {
    const { store } = await startWithWeather();
    fireEvent.click(screen.getByRole("button", { name: "Heute" }));
    fireEvent.click(screen.getByRole("button", { name: /Sonnig/ }));

    fireEvent.click(screen.getByRole("button", { name: "Einstellungen" }));
    fireEvent.click(screen.getByRole("button", { name: "Bearbeiten: Wetter" }));
    expect(screen.getByText(/Wird an 1 Tag verwendet/)).toBeTruthy();
    fireEvent.click(firstOf(screen.getAllByRole("button", { name: "Option löschen" })));
    fireEvent.click(screen.getByRole("button", { name: "Wirklich löschen" }));
    expect(screen.getAllByLabelText("Bezeichnung")).toHaveLength(6);

    fireEvent.click(screen.getByRole("button", { name: "‹ Einstellungen" }));
    fireEvent.click(screen.getByRole("button", { name: "Tracker" }));
    fireEvent.click(screen.getByRole("button", { name: /Wetter/ }));
    expect(screen.getByRole("button", { name: "17. Oktober: unbekannte Option" })).toBeTruthy();
    expect(screen.getByText("Unbekannt").closest("li")?.textContent).toBe("Unbekannt1");
    expect(store.summary.value.marks).toBe(1);
  });

  it("adds an option with the next unused color", async () => {
    await startWithWeather();
    fireEvent.click(screen.getByRole("button", { name: "Bearbeiten: Wetter" }));
    fireEvent.click(screen.getByRole("button", { name: "Option hinzufügen" }));
    expect(screen.getAllByLabelText("Bezeichnung")).toHaveLength(8);
    expect(screen.getAllByLabelText<HTMLInputElement>("Bezeichnung")[7]?.value).toBe("Option 8");
  });

  it("creates a tracker from scratch and opens its editor", async () => {
    await startWithWeather();
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Tracker anlegen" }).disabled,
    ).toBe(true);
    fireEvent.input(firstOf(screen.getAllByLabelText("Name")), {
      target: { value: "Laune" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tracker anlegen" }));
    expect(screen.getByRole("heading", { level: 1, name: "Tracker bearbeiten" })).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>("Name").value).toBe("Laune");
    expect(screen.getAllByLabelText("Bezeichnung")).toHaveLength(1);
    expect(screen.getByText("Die letzte Option kann nicht gelöscht werden.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "‹ Einstellungen" }));
    fireEvent.click(screen.getByRole("button", { name: "Heute" }));
    expect(screen.getByRole("region", { name: /Laune/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Option 1" })).toBeTruthy();
  });

  it("creates a list tracker without a legend", async () => {
    await startWithWeather();
    fireEvent.input(firstOf(screen.getAllByLabelText("Name")), {
      target: { value: "Bücher" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Liste" }));
    fireEvent.click(screen.getByRole("button", { name: "Tracker anlegen" }));
    expect(screen.queryByLabelText("Bezeichnung")).toBeNull();
    expect(screen.queryByLabelText("Ansicht")).toBeNull();
  });

  it("reorders trackers", async () => {
    const { store } = await startWithWeather();
    store.addPresets(["stress"]);
    fireEvent.click(await screen.findByRole("button", { name: "Stress nach oben" }));
    const titles = screen
      .getAllByRole("button", { name: /^Bearbeiten: / })
      .map((b) => b.getAttribute("aria-label"));
    expect(titles).toEqual(["Bearbeiten: Stress", "Bearbeiten: Wetter"]);
  });

  it("deleting a tracker names what is lost and removes it after a second tap", async () => {
    await startWithWeather();
    fireEvent.click(screen.getByRole("button", { name: "Heute" }));
    fireEvent.click(screen.getByRole("button", { name: /Sonnig/ }));
    fireEvent.click(screen.getByRole("button", { name: "Einstellungen" }));
    fireEvent.click(screen.getByRole("button", { name: "Bearbeiten: Wetter" }));
    expect(screen.getByText(/gehen 1 Tag und 0 Listeneinträge verloren/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Tracker löschen" }));
    fireEvent.click(screen.getByRole("button", { name: "Endgültig löschen" }));
    expect(screen.getByRole("heading", { level: 1, name: "Einstellungen" })).toBeTruthy();
    expect(screen.getByText("Noch keine Tracker.")).toBeTruthy();
  });
});

async function openBoard() {
  const { store, port, view } = setup();
  await store.load();
  await screen.findByRole("heading", { level: 1, name: "Womit möchtest du starten?" });
  await addPresets("Haushalt");
  const card = await screen.findByRole("region", { name: /Haushalt/ });
  const chips = within(card).getAllByRole("button");
  fireEvent.click(firstOf(chips));
  fireEvent.click(chips[2] ?? firstOf(chips));
  fireEvent.click(screen.getByRole("button", { name: "Tracker" }));
  fireEvent.click(screen.getByRole("button", { name: /Haushalt/ }));
  return { store, port, view };
}

describe("habit board", () => {
  it("shows the month as falling blocks, with the number of blocks in its name", async () => {
    await openBoard();
    expect(screen.getByTitle("Haushalt-Board Oktober 2026: 2 Blöcke")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Vormonat/ })).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: /Folgemonat/ }).disabled).toBe(
      true,
    );
  });

  it("lists the days with their habit counts and edits a day through the sheet", async () => {
    await openBoard();
    expect(screen.getByRole("button", { name: "17. Oktober: 2 Gewohnheiten" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "16. Oktober: 0 Gewohnheiten" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "16. Oktober: 0 Gewohnheiten" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /Lesen/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: /Bett machen/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Fertig" }));
    expect(screen.getByRole("button", { name: "16. Oktober: 2 Gewohnheiten" })).toBeTruthy();
    expect(screen.getByTitle("Haushalt-Board Oktober 2026: 4 Blöcke")).toBeTruthy();
  });

  it("counts habits per month in the legend", async () => {
    await openBoard();
    expect(screen.getByText("Schreibtisch aufräumen").closest("li")?.textContent).toBe(
      "Schreibtisch aufräumen1",
    );
    fireEvent.click(screen.getByRole("button", { name: /Vormonat/ }));
    expect(screen.getByText("Schreibtisch aufräumen").closest("li")?.textContent).toBe(
      "Schreibtisch aufräumen0",
    );
    expect(screen.getByTitle("Haushalt-Board September 2026: 0 Blöcke")).toBeTruthy();
  });

  it("changing the shape of a habit changes its block on the board", async () => {
    await openBoard();
    expect(screen.getByRole("heading", { name: "Tage" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Einstellungen" }));
    fireEvent.click(screen.getByRole("button", { name: "Bearbeiten: Haushalt-Board" }));
    const row = screen.getByRole("region", { name: "Schreibtisch aufräumen" });
    fireEvent.change(within(row).getByLabelText("Form"), { target: { value: "o" } });
    fireEvent.click(screen.getByRole("button", { name: "‹ Einstellungen" }));
    fireEvent.click(screen.getByRole("button", { name: "Tracker" }));
    const board = screen.getByTitle("Haushalt-Board Oktober 2026: 2 Blöcke").closest("svg");
    // The first habit is now a 2x2 square (4 cells) and the third (I) has 4 cells.
    expect(board?.querySelectorAll("g rect")).toHaveLength(8);
  });
});

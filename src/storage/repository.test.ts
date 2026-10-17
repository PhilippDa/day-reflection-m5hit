import { describe, expect, it } from "vitest";
import { createEmptyDocument } from "../domain/defaults";
import { documentWith } from "../domain/fixtures";
import { setChoice } from "../domain/marks";
import { createMemoryPort } from "./memory";
import { createRepository } from "./repository";

describe("repository", () => {
  it("starts with the default document when nothing is stored", async () => {
    const result = await createRepository(createMemoryPort()).load();
    expect(result).toEqual({ ok: true, value: createEmptyDocument() });
  });

  it("round-trips a saved document", async () => {
    const repository = createRepository(createMemoryPort());
    const doc = setChoice(documentWith("weather"), "2026-10-17", "trk_weather", "opt_weather_1");
    await repository.save(doc);
    expect(await repository.load()).toEqual({ ok: true, value: doc });
  });

  it("reports corrupt data and leaves it in place", async () => {
    const port = createMemoryPort();
    await port.write("current", { version: 2, trackers: "kaputt" });
    const result = await createRepository(port).load();
    expect(result).toMatchObject({ ok: false, error: { code: "invalid" } });
    expect(await port.read("current")).toEqual({ version: 2, trackers: "kaputt" });
  });

  it("stores snapshots separately from the live document", async () => {
    const repository = createRepository(createMemoryPort());
    expect(await repository.loadSnapshot()).toBeUndefined();
    const doc = createEmptyDocument();
    await repository.saveSnapshot(doc);
    expect(await repository.loadSnapshot()).toEqual({ ok: true, value: doc });
    expect(await repository.load()).toEqual({ ok: true, value: createEmptyDocument() });
  });

  it("round-trips meta data and keeps it apart from the document", async () => {
    const port = createMemoryPort();
    const repository = createRepository(port);
    expect(await repository.loadMeta()).toEqual({ lastExportedAt: null });
    await repository.saveMeta({ lastExportedAt: "2026-10-17T18:00:00.000Z" });
    expect(await repository.loadMeta()).toEqual({ lastExportedAt: "2026-10-17T18:00:00.000Z" });
    expect(await port.read("current")).toBeUndefined();
  });

  it("treats unreadable meta data as empty instead of failing", async () => {
    const port = createMemoryPort();
    await port.write("meta", { lastExportedAt: 42 });
    expect(await createRepository(port).loadMeta()).toEqual({ lastExportedAt: null });
  });
});

import { describe, expect, it, vi } from "vitest";
import { createEmptyDay, createEmptyDocument } from "../domain/defaults";
import { documentWith } from "../domain/fixtures";
import { setChoice } from "../domain/marks";
import type { AppDocument } from "../domain/types";
import {
  exportDocument,
  exportFileName,
  importDocument,
  parseImportFile,
  serializeDocument,
  type ExportEnvironment,
} from "./backup";
import { createMemoryPort } from "./memory";
import { createRepository } from "./repository";

const now = new Date(2026, 9, 17, 20, 15);

function documentWithWeather(optionNumber: number): AppDocument {
  return setChoice(
    documentWith("weather"),
    "2026-10-17",
    "trk_weather",
    `opt_weather_${String(optionNumber)}`,
  );
}

function environment(overrides: { canShare?: boolean; share?: ExportEnvironment["share"] } = {}) {
  const share = vi.fn<ExportEnvironment["share"]>(overrides.share ?? (() => Promise.resolve()));
  const download = vi.fn<ExportEnvironment["download"]>();
  const env: ExportEnvironment = {
    canShareFiles: () => overrides.canShare ?? true,
    share,
    download,
  };
  return { env, share, download };
}

describe("export file", () => {
  it("is named after the local date", () => {
    expect(exportFileName(now)).toBe("day-reflection-2026-10-17.json");
  });

  it("round-trips through import parsing", () => {
    const doc = documentWithWeather(1);
    expect(parseImportFile(serializeDocument(doc))).toEqual({ ok: true, value: doc });
  });
});

describe("exportDocument", () => {
  it("shares the file when the browser can", async () => {
    const { env, share, download } = environment();
    expect(await exportDocument(createEmptyDocument(), now, env)).toBe("shared");
    expect(download).not.toHaveBeenCalled();
    const file = share.mock.calls[0]?.[0].files[0];
    expect(file?.name).toBe("day-reflection-2026-10-17.json");
    expect(file?.type).toBe("application/json");
  });

  it("downloads when file sharing is unavailable", async () => {
    const { env, share, download } = environment({ canShare: false });
    expect(await exportDocument(createEmptyDocument(), now, env)).toBe("downloaded");
    expect(share).not.toHaveBeenCalled();
    expect(download).toHaveBeenCalledOnce();
  });

  it("downloads when sharing fails", async () => {
    const { env, download } = environment({ share: () => Promise.reject(new Error("boom")) });
    expect(await exportDocument(createEmptyDocument(), now, env)).toBe("downloaded");
    expect(download).toHaveBeenCalledOnce();
  });

  it("does nothing more when the user closes the share sheet", async () => {
    const { env, download } = environment({
      share: () => Promise.reject(new DOMException("closed", "AbortError")),
    });
    expect(await exportDocument(createEmptyDocument(), now, env)).toBe("cancelled");
    expect(download).not.toHaveBeenCalled();
  });
});

describe("parseImportFile", () => {
  it("rejects text that is not JSON", () => {
    expect(parseImportFile("<html>")).toEqual({ ok: false, error: { code: "not-json" } });
  });

  it("rejects JSON that is not a document", () => {
    expect(parseImportFile("[1, 2]")).toEqual({ ok: false, error: { code: "not-object" } });
    expect(parseImportFile('{"version": 2}')).toMatchObject({
      ok: false,
      error: { code: "invalid" },
    });
  });
});

describe("importDocument", () => {
  it("snapshots the current document before replacing it", async () => {
    const repository = createRepository(createMemoryPort());
    const current = documentWithWeather(1);
    const incoming = documentWithWeather(2);
    await repository.save(current);

    const result = await importDocument(repository, current, incoming, "replace");

    expect(result).toEqual(incoming);
    expect(await repository.load()).toEqual({ ok: true, value: incoming });
    expect(await repository.loadSnapshot()).toEqual({ ok: true, value: current });
  });

  it("merges when asked to", async () => {
    const repository = createRepository(createMemoryPort());
    const current = documentWithWeather(1);
    const incoming = createEmptyDocument();
    incoming.days["2026-10-18"] = createEmptyDay();

    const result = await importDocument(repository, current, incoming, "merge");

    expect(Object.keys(result.days).toSorted()).toEqual(["2026-10-17", "2026-10-18"]);
    expect(await repository.load()).toEqual({ ok: true, value: result });
  });
});

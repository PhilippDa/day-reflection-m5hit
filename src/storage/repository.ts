import * as v from "valibot";
import { createEmptyDocument } from "../domain/defaults";
import { parseDocument, type ParseError } from "../domain/parse";
import { ok, type Result } from "../domain/result";
import type { AppDocument } from "../domain/types";
import type { StoragePort } from "./port";

export interface Meta {
  /** ISO timestamp of the last successful export, or `null` if there never was one. */
  readonly lastExportedAt: string | null;
}

const metaSchema = v.looseObject({
  lastExportedAt: v.nullable(v.pipe(v.string(), v.isoTimestamp())),
});

const EMPTY_META: Meta = { lastExportedAt: null };

export interface Repository {
  /**
   * An empty slot yields a fresh default document. Stored data that fails migration or
   * validation yields an error and is left untouched: callers must not overwrite it silently.
   */
  load(): Promise<Result<AppDocument, ParseError>>;
  save(doc: AppDocument): Promise<void>;
  saveSnapshot(doc: AppDocument): Promise<void>;
  loadSnapshot(): Promise<Result<AppDocument, ParseError> | undefined>;
  /** Unreadable or missing meta data is not worth failing for: it yields the empty meta. */
  loadMeta(): Promise<Meta>;
  saveMeta(meta: Meta): Promise<void>;
}

export function createRepository(port: StoragePort): Repository {
  return {
    async load() {
      const raw = await port.read("current");
      return raw === undefined ? ok(createEmptyDocument()) : parseDocument(raw);
    },
    save(doc) {
      return port.write("current", doc);
    },
    saveSnapshot(doc) {
      return port.write("snapshot", doc);
    },
    async loadSnapshot() {
      const raw = await port.read("snapshot");
      return raw === undefined ? undefined : parseDocument(raw);
    },
    async loadMeta() {
      const parsed = v.safeParse(metaSchema, await port.read("meta"));
      return parsed.success ? { lastExportedAt: parsed.output.lastExportedAt } : EMPTY_META;
    },
    saveMeta(meta) {
      return port.write("meta", meta);
    },
  };
}

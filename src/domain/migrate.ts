import { CURRENT_VERSION } from "./schema";
import { err, ok, type Result } from "./result";

export type RawDocument = Record<string, unknown>;

/** A migration turns a document of version N into one of version N + 1. */
export type Migration = (doc: RawDocument) => RawDocument;

// Version 1 (the checklist app) was never deployed, so there is nothing to migrate from it.
// Add `2: (doc) => ...` here when the schema moves to version 3, and so on.
export const MIGRATIONS: Readonly<Record<number, Migration>> = {};

export type MigrateError =
  | { readonly code: "not-object" }
  | { readonly code: "missing-version" }
  | { readonly code: "unsupported-version"; readonly version: number }
  | { readonly code: "outdated-version"; readonly version: number };

export interface MigrateOptions {
  readonly migrations?: Readonly<Record<number, Migration>>;
  readonly currentVersion?: number;
}

function isRecord(value: unknown): value is RawDocument {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Brings any known older document up to the current version. Does not validate the shape. */
export function migrate(
  raw: unknown,
  options: MigrateOptions = {},
): Result<RawDocument, MigrateError> {
  const migrations = options.migrations ?? MIGRATIONS;
  const currentVersion = options.currentVersion ?? CURRENT_VERSION;

  if (!isRecord(raw)) {
    return err({ code: "not-object" });
  }
  const startVersion = raw["version"];
  if (typeof startVersion !== "number" || !Number.isInteger(startVersion) || startVersion < 1) {
    return err({ code: "missing-version" });
  }
  if (startVersion > currentVersion) {
    return err({ code: "unsupported-version", version: startVersion });
  }

  let doc: RawDocument = raw;
  for (let version = startVersion; version < currentVersion; version += 1) {
    const step = migrations[version];
    if (!step) {
      return err({ code: "outdated-version", version });
    }
    doc = { ...step(doc), version: version + 1 };
  }
  return ok(doc);
}

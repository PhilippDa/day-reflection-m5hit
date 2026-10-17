import * as v from "valibot";
import { migrate, type MigrateError, type MigrateOptions } from "./migrate";
import { err, ok, type Result } from "./result";
import { documentSchema } from "./schema";
import type { AppDocument } from "./types";

export type ParseError =
  | MigrateError
  | { readonly code: "invalid"; readonly path: string; readonly message: string };

/** The only way untrusted data (storage, imported files) becomes an `AppDocument`. */
export function parseDocument(
  raw: unknown,
  options?: MigrateOptions,
): Result<AppDocument, ParseError> {
  const migrated = migrate(raw, options);
  if (!migrated.ok) {
    return migrated;
  }
  const parsed = v.safeParse(documentSchema, migrated.value);
  if (!parsed.success) {
    const issue = parsed.issues[0];
    return err({
      code: "invalid",
      path: issue ? (v.getDotPath(issue) ?? "") : "",
      message: issue?.message ?? "Invalid document",
    });
  }
  return ok(parsed.output);
}

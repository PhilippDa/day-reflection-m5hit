import { applyImport, type ImportMode } from "../domain/merge";
import { parseDocument, type ParseError } from "../domain/parse";
import { err, type Result } from "../domain/result";
import { toDateKey } from "../domain/dates";
import type { AppDocument } from "../domain/types";
import type { Repository } from "./repository";

export function serializeDocument(doc: AppDocument): string {
  return `${JSON.stringify(doc, null, 2)}\n`;
}

export function exportFileName(now: Date): string {
  return `day-reflection-${toDateKey(now)}.json`;
}

export type ExportOutcome = "shared" | "downloaded" | "cancelled";

/** The browser features export needs, injectable so the logic can be tested. */
export interface ExportEnvironment {
  canShareFiles(files: File[]): boolean;
  share(data: { files: File[]; title: string }): Promise<void>;
  download(file: File): void;
}

export function browserExportEnvironment(): ExportEnvironment {
  return {
    canShareFiles: (files) =>
      typeof navigator.canShare === "function" && navigator.canShare({ files }),
    share: (data) => navigator.share(data),
    download: (file) => {
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 10_000);
    },
  };
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/**
 * Hands the document to the share sheet (iOS: "Save to Files") when file sharing works,
 * and downloads it otherwise. Backing out of the share sheet is not an error.
 */
export async function exportDocument(
  doc: AppDocument,
  now: Date,
  env: ExportEnvironment = browserExportEnvironment(),
): Promise<ExportOutcome> {
  const file = new File([serializeDocument(doc)], exportFileName(now), {
    type: "application/json",
  });
  if (env.canShareFiles([file])) {
    try {
      await env.share({ files: [file], title: file.name });
      return "shared";
    } catch (error) {
      if (isAbort(error)) {
        return "cancelled";
      }
    }
  }
  env.download(file);
  return "downloaded";
}

export type ImportFileError = { readonly code: "not-json" } | ParseError;

/** Turns the text of a chosen file into a validated document. */
export function parseImportFile(text: string): Result<AppDocument, ImportFileError> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return err({ code: "not-json" });
  }
  return parseDocument(raw);
}

/**
 * Saves a snapshot of `current` first, so a wrong import can be undone, then stores
 * and returns the imported result.
 */
export async function importDocument(
  repository: Repository,
  current: AppDocument,
  incoming: AppDocument,
  mode: ImportMode,
): Promise<AppDocument> {
  await repository.saveSnapshot(current);
  const next = applyImport(current, incoming, mode);
  await repository.save(next);
  return next;
}

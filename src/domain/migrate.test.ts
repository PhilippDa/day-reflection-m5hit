import { describe, expect, it } from "vitest";
import { migrate } from "./migrate";

const migrations = {
  1: (doc: Record<string, unknown>) => ({ ...doc, renamed: doc["old"] }),
  2: (doc: Record<string, unknown>) => ({ ...doc, upgraded: true }),
};

describe("migrate", () => {
  it("runs every step from the start version to the current one", () => {
    const result = migrate({ version: 1, old: "x" }, { migrations, currentVersion: 3 });
    expect(result).toEqual({
      ok: true,
      value: { version: 3, old: "x", renamed: "x", upgraded: true },
    });
  });

  it("starts mid-way for newer documents", () => {
    const result = migrate({ version: 2 }, { migrations, currentVersion: 3 });
    expect(result).toEqual({ ok: true, value: { version: 3, upgraded: true } });
  });

  it("leaves a current document alone", () => {
    expect(migrate({ version: 3, a: 1 }, { migrations, currentVersion: 3 })).toEqual({
      ok: true,
      value: { version: 3, a: 1 },
    });
  });

  it("does not mutate its input", () => {
    const input = { version: 1, old: "x" };
    migrate(input, { migrations, currentVersion: 3 });
    expect(input).toEqual({ version: 1, old: "x" });
  });

  it.each([null, undefined, "text", 42, [], [{ version: 1 }]])(
    "rejects non-objects (%j)",
    (raw) => {
      expect(migrate(raw)).toEqual({ ok: false, error: { code: "not-object" } });
    },
  );

  it.each([{}, { version: "1" }, { version: 0 }, { version: 1.5 }, { version: null }])(
    "rejects a missing or bad version (%j)",
    (raw) => {
      expect(migrate(raw)).toEqual({ ok: false, error: { code: "missing-version" } });
    },
  );

  it("rejects files from a newer app", () => {
    expect(migrate({ version: 4 }, { migrations, currentVersion: 3 })).toEqual({
      ok: false,
      error: { code: "unsupported-version", version: 4 },
    });
  });

  it("rejects when a migration step is missing", () => {
    expect(migrate({ version: 1 }, { migrations: {}, currentVersion: 2 })).toEqual({
      ok: false,
      error: { code: "outdated-version", version: 1 },
    });
  });
});

import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { computeVersion, listFiles, renderServiceWorker } from "./service-worker";

const enc = (text: string) => new TextEncoder().encode(text);

describe("computeVersion", () => {
  const base = [{ path: "index.html", content: enc("a") }];

  it("is stable for the same files", () => {
    expect(computeVersion(base)).toBe(computeVersion([...base]));
  });

  it("changes when content or a file name changes", () => {
    const version = computeVersion(base);
    expect(computeVersion([{ path: "index.html", content: enc("b") }])).not.toBe(version);
    expect(computeVersion([{ path: "other.html", content: enc("a") }])).not.toBe(version);
  });
});

describe("renderServiceWorker", () => {
  it("fills in the version and the precache list, starting with the start URL", () => {
    const out = renderServiceWorker('const V = "__VERSION__"; const P = __PRECACHE__;', "abc", [
      "index.html",
      "assets/app.js",
    ]);
    expect(out).toContain('const V = "abc"');
    expect(out).toContain('"./"');
    expect(out).toContain('"./assets/app.js"');
    expect(out).not.toContain("__PRECACHE__");
  });
});

describe("listFiles", () => {
  it("lists nested files sorted and leaves out the worker itself", () => {
    const dir = mkdtempSync(join(tmpdir(), "sw-test-"));
    mkdirSync(join(dir, "assets"));
    writeFileSync(join(dir, "index.html"), "x");
    writeFileSync(join(dir, "sw.js"), "x");
    writeFileSync(join(dir, "assets", "a.js"), "x");
    expect(listFiles(dir)).toEqual(["assets/a.js", "index.html"]);
  });
});

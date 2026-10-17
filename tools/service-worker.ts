import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type { Plugin } from "vite";

const TEMPLATE_PATH = join(import.meta.dirname, "sw.template.js");
// The service worker must not cache itself.
const EXCLUDED = new Set(["sw.js"]);

/** Every file below `dir`, as sorted paths relative to it with forward slashes. */
export function listFiles(dir: string): string[] {
  const found: string[] = [];
  const walk = (current: string): void => {
    for (const name of readdirSync(current)) {
      const path = join(current, name);
      if (statSync(path).isDirectory()) {
        walk(path);
      } else {
        found.push(relative(dir, path).split(sep).join("/"));
      }
    }
  };
  walk(dir);
  return found.filter((file) => !EXCLUDED.has(file)).toSorted();
}

/** Changes whenever any cached file's name or content changes. */
export function computeVersion(files: readonly { path: string; content: Uint8Array }[]): string {
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(file.path);
    hash.update("\0");
    hash.update(file.content);
    hash.update("\0");
  }
  return hash.digest("hex").slice(0, 12);
}

export function renderServiceWorker(
  template: string,
  version: string,
  files: readonly string[],
): string {
  // "./" caches the start URL, the files are listed relative to the service worker.
  const urls = ["./", ...files.map((file) => `./${file}`)];
  return template
    .replace("__VERSION__", version)
    .replace("__PRECACHE__", JSON.stringify(urls, null, 2));
}

/** After the build, writes `sw.js` into the output folder, precaching everything in it. */
export function serviceWorkerPlugin(): Plugin {
  let outDir = "dist";
  return {
    name: "day-reflection-service-worker",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const files = listFiles(outDir);
      const version = computeVersion(
        files.map((path) => ({ path, content: readFileSync(join(outDir, path)) })),
      );
      const source = renderServiceWorker(readFileSync(TEMPLATE_PATH, "utf8"), version, files);
      writeFileSync(join(outDir, "sw.js"), source);
    },
  };
}

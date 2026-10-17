import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import { createIndexedDbPort } from "./indexeddb";
import { createMemoryPort } from "./memory";
import type { StoragePort } from "./port";

const adapters: [string, () => StoragePort][] = [
  ["memory", createMemoryPort],
  ["indexeddb", () => createIndexedDbPort(new IDBFactory())],
];

describe.each(adapters)("StoragePort contract: %s", (_name, create) => {
  it("reads undefined from an empty slot", async () => {
    expect(await create().read("current")).toBeUndefined();
  });

  it("returns what was written, as a copy", async () => {
    const port = create();
    const value = { version: 1, nested: { list: [1, 2, 3] } };
    await port.write("current", value);
    value.nested.list.push(4);
    expect(await port.read("current")).toEqual({ version: 1, nested: { list: [1, 2, 3] } });
  });

  it("keeps slots apart and overwrites within a slot", async () => {
    const port = create();
    await port.write("current", "a");
    await port.write("snapshot", "b");
    await port.write("current", "c");
    expect(await port.read("current")).toBe("c");
    expect(await port.read("snapshot")).toBe("b");
  });
});

describe("indexeddb persistence", () => {
  it("survives reopening the same database", async () => {
    const factory = new IDBFactory();
    await createIndexedDbPort(factory).write("current", { saved: true });
    expect(await createIndexedDbPort(factory).read("current")).toEqual({ saved: true });
  });
});

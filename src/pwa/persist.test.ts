import { describe, expect, it, vi } from "vitest";
import { requestPersistence } from "./persist";

function storage(persisted: boolean, grants: boolean) {
  return {
    persisted: vi.fn<() => Promise<boolean>>().mockResolvedValue(persisted),
    persist: vi.fn<() => Promise<boolean>>().mockResolvedValue(grants),
  };
}

describe("requestPersistence", () => {
  it("does not ask again when storage is already persistent", async () => {
    const fake = storage(true, false);
    expect(await requestPersistence(fake)).toBe(true);
    expect(fake.persist).not.toHaveBeenCalled();
  });

  it("asks and reports the answer", async () => {
    expect(await requestPersistence(storage(false, true))).toBe(true);
    expect(await requestPersistence(storage(false, false))).toBe(false);
  });

  it("survives a browser without the API or one that throws", async () => {
    expect(await requestPersistence(undefined)).toBe(false);
    const broken = {
      persisted: () => Promise.reject(new Error("no")),
      persist: () => Promise.reject(new Error("no")),
    };
    expect(await requestPersistence(broken)).toBe(false);
  });
});

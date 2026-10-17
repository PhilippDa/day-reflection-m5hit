import type { Slot, StoragePort } from "./port";

/** For tests. Clones on the way in and out, like a real database would. */
export function createMemoryPort(): StoragePort {
  const slots = new Map<Slot, unknown>();
  return {
    read(slot) {
      const value = slots.get(slot);
      return Promise.resolve(value === undefined ? undefined : structuredClone(value));
    },
    write(slot, value) {
      slots.set(slot, structuredClone(value));
      return Promise.resolve();
    },
  };
}

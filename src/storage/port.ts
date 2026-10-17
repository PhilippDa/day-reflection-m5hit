/**
 * "current" is the live document. "snapshot" is the copy taken right before an import.
 * "meta" holds app bookkeeping that does not belong in exported backups, such as the last export time.
 */
export type Slot = "current" | "snapshot" | "meta";

/**
 * The smallest thing a storage backend must do. It stores plain JSON values and never
 * validates them: that is the repository's job. `read` resolves to `undefined` for an empty slot.
 */
export interface StoragePort {
  read(slot: Slot): Promise<unknown>;
  write(slot: Slot, value: unknown): Promise<void>;
}

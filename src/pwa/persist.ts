/**
 * Asks the browser not to evict our data under storage pressure. Whether iOS Safari honours
 * this is unverified, so the export backup stays the real safeguard. Never throws.
 */
export async function requestPersistence(
  storage: Pick<StorageManager, "persist" | "persisted"> | undefined = navigator.storage,
): Promise<boolean> {
  try {
    if (!storage) {
      return false;
    }
    return (await storage.persisted()) || (await storage.persist());
  } catch {
    return false;
  }
}

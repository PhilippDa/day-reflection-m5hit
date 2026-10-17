import type { Slot, StoragePort } from "./port";

const DB_NAME = "day-reflection";
const STORE = "documents";

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => {
      resolve(request.result);
    });
    request.addEventListener("error", () => {
      reject(request.error ?? new Error("IndexedDB request failed"));
    });
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener("complete", () => {
      resolve();
    });
    transaction.addEventListener("error", () => {
      reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    });
    transaction.addEventListener("abort", () => {
      reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
    });
  });
}

function openDatabase(factory: IDBFactory, name: string): Promise<IDBDatabase> {
  const request = factory.open(name, 1);
  request.addEventListener("upgradeneeded", () => {
    request.result.createObjectStore(STORE);
  });
  return requestResult(request);
}

export function createIndexedDbPort(
  factory: IDBFactory = indexedDB,
  name: string = DB_NAME,
): StoragePort {
  let database: Promise<IDBDatabase> | undefined;
  const open = (): Promise<IDBDatabase> => {
    database ??= openDatabase(factory, name);
    return database;
  };

  return {
    async read(slot: Slot) {
      const db = await open();
      const value: unknown = await requestResult(
        db.transaction(STORE, "readonly").objectStore(STORE).get(slot),
      );
      return value;
    },
    async write(slot: Slot, value: unknown) {
      const db = await open();
      const transaction = db.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).put(value, slot);
      await transactionDone(transaction);
    },
  };
}

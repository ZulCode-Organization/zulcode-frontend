export type OfflineMutation = {
  id: string;
  method: string;
  url: string;
  body?: string;
  owner: string;
  createdAt: number;
};

type CachedResponse = { key: string; body: string; contentType: string; updatedAt: number };

const DB_NAME = "zulcode-offline";
const DB_VERSION = 1;
const RESPONSES = "responses";
const QUEUE = "queue";

function available() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (!available()) return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(RESPONSES)) database.createObjectStore(RESPONSES, { keyPath: "key" });
      if (!database.objectStoreNames.contains(QUEUE)) database.createObjectStore(QUEUE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

async function transaction<T>(store: string, mode: IDBTransactionMode, operation: (objectStore: IDBObjectStore) => IDBRequest<unknown>): Promise<T | undefined> {
  const database = await openDatabase();
  if (!database) return undefined;
  return new Promise<T | undefined>((resolve) => {
    const request = operation(database.transaction(store, mode).objectStore(store));
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => resolve(undefined);
  }).finally(() => database.close());
}

export async function cacheApiResponse(key: string, body: string, contentType = "application/json") {
  await transaction<CachedResponse>(RESPONSES, "readwrite", (store) => store.put({ key, body, contentType, updatedAt: Date.now() }));
}

export async function getCachedApiResponse(key: string) {
  return transaction<CachedResponse>(RESPONSES, "readonly", (store) => store.get(key));
}

export async function queueMutation(mutation: OfflineMutation) {
  await transaction<OfflineMutation>(QUEUE, "readwrite", (store) => store.put(mutation));
}

export async function getQueuedMutations(owner: string) {
  const all = await transaction<OfflineMutation[]>(QUEUE, "readonly", (store) => store.getAll());
  return (all ?? []).filter((item) => item.owner === owner).sort((a, b) => a.createdAt - b.createdAt);
}

export async function removeQueuedMutation(id: string) {
  await transaction(QUEUE, "readwrite", (store) => store.delete(id));
}

// The access token is never persisted here; this only partitions cached account data.
export function accountKey(token?: string | null) {
  let hash = 5381;
  for (const character of token ?? "anonymous") hash = (hash * 33) ^ character.charCodeAt(0);
  return `u-${(hash >>> 0).toString(36)}`;
}

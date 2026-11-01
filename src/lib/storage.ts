type StorageAdapter = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<unknown>;
  removeItemAsync: (key: string) => Promise<unknown>;
};

/**
 * In-memory fallback used when the native SQLite module is unavailable (for
 * example, in an Expo Go client that does not bundle expo-sqlite). Persistence
 * is limited to the current session, but the app keeps working.
 */
const memoryStore = new Map<string, string>();

const memoryAdapter: StorageAdapter = {
  async getItemAsync(key) {
    return memoryStore.get(key) ?? null;
  },
  async setItemAsync(key, value) {
    memoryStore.set(key, value);
  },
  async removeItemAsync(key) {
    memoryStore.delete(key);
  },
};

let storagePromise: Promise<StorageAdapter> | null = null;

function loadStorage(): Promise<StorageAdapter> {
  if (!storagePromise) {
    // Imported lazily so a missing native module cannot crash route evaluation.
    storagePromise = import('expo-sqlite/kv-store')
      .then((module) => module.default)
      .catch((error) => {
        console.warn('SQLite storage is unavailable; using session storage instead.', error);
        return memoryAdapter;
      });
  }

  return storagePromise!;
}

/**
 * Native key-value storage backed by expo-sqlite. `storage.web.ts` overrides
 * this file on web so the SQLite wasm bundle is never pulled into the web app.
 */
export async function getStoredValue(key: string): Promise<string | null> {
  try {
    const storage = await loadStorage();
    return await storage.getItemAsync(key);
  } catch (error) {
    console.warn(`Unable to read "${key}" from storage`, error);
    return null;
  }
}

export async function setStoredValue(key: string, value: string): Promise<void> {
  try {
    const storage = await loadStorage();
    await storage.setItemAsync(key, value);
  } catch (error) {
    console.warn(`Unable to write "${key}" to storage`, error);
  }
}

export async function removeStoredValue(key: string): Promise<void> {
  try {
    const storage = await loadStorage();
    await storage.removeItemAsync(key);
  } catch (error) {
    console.warn(`Unable to remove "${key}" from storage`, error);
  }
}

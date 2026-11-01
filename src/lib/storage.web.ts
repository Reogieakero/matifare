/**
 * Web key-value storage. Metro resolves this file for web builds, keeping the
 * expo-sqlite wasm runtime (and its extra web setup) out of the browser bundle.
 */
export async function getStoredValue(key: string): Promise<string | null> {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export async function setStoredValue(key: string, value: string): Promise<void> {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Safari private mode and similar can reject writes. Onboarding simply
    // shows again on the next launch.
  }
}

export async function removeStoredValue(key: string): Promise<void> {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    // Ignore storage failures.
  }
}

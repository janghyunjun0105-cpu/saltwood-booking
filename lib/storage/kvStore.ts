/**
 * Key-value storage that prefers window.localStorage and quietly falls back to
 * an in-memory map when localStorage is blocked (private browsing, disabled
 * cookies, sandboxed iframes) or full. The caller is told once, through
 * `onFallback`, so the UI can show a notice.
 */

export type StorageMode = "local" | "memory";
export type StorageFallbackReason = "unavailable" | "quota";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface KeyValueStore extends StorageLike {
  readonly mode: StorageMode;
}

export class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

export function isQuotaError(error: unknown): boolean {
  if (typeof DOMException === "undefined" || !(error instanceof DOMException)) return false;
  return (
    error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    error.code === 22 ||
    error.code === 1014
  );
}

interface ResilientStoreOptions {
  /** Returns the preferred backend. May throw (Safari and Firefox do when storage is blocked). */
  getBackend: () => StorageLike | null | undefined;
  onFallback?: (reason: StorageFallbackReason) => void;
}

const PROBE_KEY = "__saltwood_probe__";

export function createResilientStore({ getBackend, onFallback }: ResilientStoreOptions): KeyValueStore {
  const memory = new MemoryStorage();
  // undefined = not probed yet, null = unavailable
  let backend: StorageLike | null | undefined;
  let mode: StorageMode = "local";

  function fallBack(reason: StorageFallbackReason) {
    backend = null;
    if (mode === "memory") return;
    mode = "memory";
    onFallback?.(reason);
  }

  function resolveBackend(): StorageLike | null {
    if (backend !== undefined) return backend;
    try {
      const candidate = getBackend();
      if (!candidate) throw new Error("Storage is not available.");
      candidate.setItem(PROBE_KEY, "1");
      candidate.removeItem(PROBE_KEY);
      backend = candidate;
    } catch (error) {
      fallBack(isQuotaError(error) ? "quota" : "unavailable");
    }
    return backend ?? null;
  }

  return {
    get mode() {
      resolveBackend();
      return mode;
    },

    getItem(key) {
      const active = resolveBackend();
      if (active) {
        try {
          return active.getItem(key);
        } catch {
          fallBack("unavailable");
        }
      }
      return memory.getItem(key);
    },

    setItem(key, value) {
      const active = resolveBackend();
      if (active) {
        try {
          active.setItem(key, value);
          return;
        } catch (error) {
          fallBack(isQuotaError(error) ? "quota" : "unavailable");
        }
      }
      memory.setItem(key, value);
    },

    removeItem(key) {
      memory.removeItem(key);
      const active = resolveBackend();
      if (!active) return;
      try {
        active.removeItem(key);
      } catch {
        fallBack("unavailable");
      }
    },
  };
}

/** Reads window.localStorage without throwing during SSR. Accessing it can itself throw when blocked. */
export function getBrowserLocalStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function getBrowserSessionStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

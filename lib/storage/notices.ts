/** A tiny external store for storage problems the user should know about. */

export type StorageNoticeKind = "unavailable" | "quota" | "corrupt";

const EMPTY: readonly StorageNoticeKind[] = [];
let notices: readonly StorageNoticeKind[] = EMPTY;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function pushStorageNotice(kind: StorageNoticeKind) {
  if (notices.includes(kind)) return;
  notices = [...notices, kind];
  emit();
}

export function dismissStorageNotice(kind: StorageNoticeKind) {
  notices = notices.filter((notice) => notice !== kind);
  emit();
}

export function subscribeStorageNotices(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getStorageNotices() {
  return notices;
}

export function getServerStorageNotices() {
  return EMPTY;
}

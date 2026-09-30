"use client";

import { useSyncExternalStore } from "react";
import { AlertIcon, XIcon } from "@/components/ui/icons";
import {
  dismissStorageNotice,
  getServerStorageNotices,
  getStorageNotices,
  subscribeStorageNotices,
  type StorageNoticeKind,
} from "@/lib/storage/notices";

const MESSAGES: Record<StorageNoticeKind, string> = {
  unavailable:
    "This browser is blocking local storage (private mode can do this), so bookings are kept in memory and will clear when you close the tab.",
  quota: "This browser's storage is full, so new changes are kept in memory and will clear when you close the tab.",
  corrupt: "Saved demo data couldn't be read, so we loaded a fresh set of sample bookings.",
};

/** Small, dismissible notices for storage problems. Sits under the demo banner. */
export function StorageNotice() {
  const notices = useSyncExternalStore(subscribeStorageNotices, getStorageNotices, getServerStorageNotices);

  return (
    <div aria-live="polite">
      {notices.map((kind) => (
        <div key={kind} className="border-b border-accent/40 bg-accent-soft">
          <div className="container-page flex items-start gap-3 py-2">
            <AlertIcon className="mt-2.5 size-5 shrink-0 text-accent-ink" />
            <p className="flex-1 py-2 text-sm">{MESSAGES[kind]}</p>
            <button
              type="button"
              onClick={() => dismissStorageNotice(kind)}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink/70 hover:bg-accent/15 hover:text-ink"
            >
              <XIcon />
              <span className="sr-only">Dismiss</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

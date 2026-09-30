/**
 * The app's single data entry point. To move to a real database, implement
 * BookingRepository (see ./bookingRepo.ts) and export that instance here instead.
 */
import { createLocalBookingRepository, type BookingRepository } from "@/lib/storage/bookingRepo";
import { createResilientStore, getBrowserLocalStorage } from "@/lib/storage/kvStore";
import { pushStorageNotice } from "@/lib/storage/notices";

function subscribeToOtherTabs(key: string, onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (event: StorageEvent) => {
    // key is null when another tab calls localStorage.clear()
    if (event.key === key || event.key === null) onChange();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

export const bookingRepo: BookingRepository = createLocalBookingRepository({
  store: createResilientStore({
    getBackend: getBrowserLocalStorage,
    onFallback: (reason) => pushStorageNotice(reason),
  }),
  onCorrupt: () => pushStorageNotice("corrupt"),
  subscribeExternal: subscribeToOtherTabs,
});

export { BookingLockedError, BookingNotFoundError, BookingUnavailableError } from "@/lib/storage/errors";
export type { BookingRepository, NewBookingInput, RescheduleInput } from "@/lib/storage/bookingRepo";

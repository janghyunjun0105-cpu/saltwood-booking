/**
 * The booking repository is the only thing UI code talks to for data.
 *
 * `BookingRepository` is async on purpose: the localStorage version below
 * resolves immediately, and a Supabase (or any HTTP) version can implement
 * the same interface without touching a single component. See README →
 * "How to connect a real database".
 */
import { checkSlotBookable, countTablesTaken, holdsTable, isSlotTooSoon } from "@/lib/availability";
import { generateUniqueBookingCode, normalizeBookingCodeInput } from "@/lib/bookingCode";
import { createId, secureRandom, type RandomSource } from "@/lib/random";
import {
  STATE_VERSION,
  settingsSchema,
  storedStateSchema,
  type Booking,
  type BookingStatus,
  type GuestDetails,
  type Settings,
  type StoredState,
} from "@/lib/schemas";
import { createSeedBookings } from "@/lib/seed";
import { createDefaultSettings } from "@/lib/settings";
import { getRestaurantNow, normalizeUsPhone, type DateKey, type TimeKey } from "@/lib/time";
import { BookingLockedError, BookingNotFoundError, BookingUnavailableError } from "@/lib/storage/errors";
import type { KeyValueStore } from "@/lib/storage/kvStore";

export interface NewBookingInput {
  date: DateKey;
  time: TimeKey;
  partySize: number;
  guest: GuestDetails;
}

export interface RescheduleInput {
  date: DateKey;
  time: TimeKey;
  partySize: number;
}

export interface BookingRepository {
  listBookings(): Promise<Booking[]>;
  listBookingsForDate(date: DateKey): Promise<Booking[]>;
  getBookingByCode(code: string): Promise<Booking | null>;
  /** Guest lookup: both the code and the email must match. */
  findBookingForGuest(code: string, email: string): Promise<Booking | null>;
  /** Re-checks availability against the latest data and throws BookingUnavailableError if the slot is gone. */
  createBooking(input: NewBookingInput): Promise<Booking>;
  /** Guest reschedule. The booking's own table is excluded from the capacity check. */
  rescheduleBooking(id: string, input: RescheduleInput): Promise<Booking>;
  /** Guest cancellation. Frees the table right away. */
  cancelBooking(id: string): Promise<Booking>;
  /** Staff status change from the dashboard. */
  setBookingStatus(id: string, status: BookingStatus): Promise<Booking>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<Settings>;
  /** Replaces everything with fresh sample data. */
  resetDemoData(): Promise<void>;
  /** Called whenever data changes, in this tab or another one. */
  subscribe(listener: () => void): () => void;
}

export { BookingLockedError, BookingNotFoundError, BookingUnavailableError };

export const STORAGE_KEY = `saltwood:v${STATE_VERSION}:state`;

interface LocalRepositoryOptions {
  store: KeyValueStore;
  clock?: () => Date;
  random?: RandomSource;
  /** Saved data failed validation and was replaced with fresh sample data. */
  onCorrupt?: () => void;
  /** Hook for change events from other tabs (window "storage" events in the browser). */
  subscribeExternal?: (key: string, onChange: () => void) => () => void;
}

function byDateAndTime(a: Booking, b: Booking): number {
  return (a.date + a.time).localeCompare(b.date + b.time) || a.lastName.localeCompare(b.lastName);
}

export function createLocalBookingRepository({
  store,
  clock = () => new Date(),
  random = secureRandom,
  onCorrupt,
  subscribeExternal,
}: LocalRepositoryOptions): BookingRepository {
  const listeners = new Set<() => void>();
  let detachExternal: (() => void) | null = null;
  let cachedRaw: string | null = null;
  let cachedState: StoredState | null = null;

  function emit() {
    for (const listener of listeners) listener();
  }

  function createSeedState(): StoredState {
    const instant = clock();
    const now = getRestaurantNow(instant);
    const settings = createDefaultSettings();
    return {
      version: STATE_VERSION,
      seededOn: now.date,
      settings,
      bookings: createSeedBookings({ now, settings, instant }),
    };
  }

  function write(state: StoredState) {
    const raw = JSON.stringify(state);
    store.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
    cachedState = state;
  }

  /** Always reads from storage (cheap, and picks up writes from other tabs), parsing only when it changed. */
  function read(): StoredState {
    const raw = store.getItem(STORAGE_KEY);
    if (raw !== null && raw === cachedRaw && cachedState) return cachedState;

    if (raw === null) {
      const seeded = createSeedState();
      write(seeded);
      return seeded;
    }

    let parsed: ReturnType<typeof storedStateSchema.safeParse>;
    try {
      parsed = storedStateSchema.safeParse(JSON.parse(raw));
    } catch {
      parsed = storedStateSchema.safeParse(undefined);
    }
    if (!parsed.success) {
      const seeded = createSeedState();
      write(seeded);
      onCorrupt?.();
      return seeded;
    }

    cachedRaw = raw;
    cachedState = parsed.data;
    return parsed.data;
  }

  function commit(state: StoredState) {
    write(state);
    emit();
  }

  function findByCode(code: string): Booking | null {
    const normalized = normalizeBookingCodeInput(code);
    return read().bookings.find((booking) => booking.code === normalized) ?? null;
  }

  function requireBooking(state: StoredState, id: string): Booking {
    const booking = state.bookings.find((candidate) => candidate.id === id);
    if (!booking) throw new BookingNotFoundError();
    return booking;
  }

  function replaceBooking(state: StoredState, updated: Booking): StoredState {
    return {
      ...state,
      bookings: state.bookings.map((booking) => (booking.id === updated.id ? updated : booking)),
    };
  }

  /** Guests may only change upcoming, confirmed bookings. */
  function assertGuestCanChange(booking: Booking) {
    const now = getRestaurantNow(clock());
    if (booking.status !== "confirmed" || isSlotTooSoon(booking.date, booking.time, now)) {
      throw new BookingLockedError();
    }
  }

  return {
    async listBookings() {
      return [...read().bookings].sort(byDateAndTime);
    },

    async listBookingsForDate(date) {
      return read()
        .bookings.filter((booking) => booking.date === date)
        .sort(byDateAndTime);
    },

    async getBookingByCode(code) {
      return findByCode(code);
    },

    async findBookingForGuest(code, email) {
      const booking = findByCode(code);
      if (!booking) return null;
      return booking.email.toLowerCase() === email.trim().toLowerCase() ? booking : null;
    },

    async createBooking({ date, time, partySize, guest }) {
      const state = read();
      const check = checkSlotBookable({
        settings: state.settings,
        bookings: state.bookings,
        date,
        time,
        partySize,
        now: getRestaurantNow(clock()),
      });
      if (!check.ok) throw new BookingUnavailableError(check.reason);

      const timestamp = clock().toISOString();
      const booking: Booking = {
        id: createId(random),
        code: generateUniqueBookingCode((code) => state.bookings.some((existing) => existing.code === code), random),
        date,
        time,
        partySize,
        firstName: guest.firstName.trim(),
        lastName: guest.lastName.trim(),
        email: guest.email.trim(),
        phone: normalizeUsPhone(guest.phone) ?? guest.phone,
        occasion: guest.occasion,
        specialRequests: guest.specialRequests.trim(),
        smsReminder: guest.smsReminder,
        status: "confirmed",
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      commit({ ...state, bookings: [...state.bookings, booking] });
      return booking;
    },

    async rescheduleBooking(id, { date, time, partySize }) {
      const state = read();
      const booking = requireBooking(state, id);
      assertGuestCanChange(booking);

      const check = checkSlotBookable({
        settings: state.settings,
        bookings: state.bookings,
        date,
        time,
        partySize,
        now: getRestaurantNow(clock()),
        excludeBookingId: id,
      });
      if (!check.ok) throw new BookingUnavailableError(check.reason);

      const updated: Booking = { ...booking, date, time, partySize, updatedAt: clock().toISOString() };
      commit(replaceBooking(state, updated));
      return updated;
    },

    async cancelBooking(id) {
      const state = read();
      const booking = requireBooking(state, id);
      assertGuestCanChange(booking);
      const updated: Booking = { ...booking, status: "cancelled", updatedAt: clock().toISOString() };
      commit(replaceBooking(state, updated));
      return updated;
    },

    async setBookingStatus(id, status) {
      const state = read();
      const booking = requireBooking(state, id);
      if (booking.status === status) return booking;

      // Bringing a cancelled booking back needs its table to still be free.
      const reactivating = !holdsTable(booking) && status !== "cancelled";
      if (
        reactivating &&
        countTablesTaken(state.bookings, booking.date, booking.time, booking.id) >= state.settings.tablesPerSlot
      ) {
        throw new BookingUnavailableError("full");
      }

      const updated: Booking = { ...booking, status, updatedAt: clock().toISOString() };
      commit(replaceBooking(state, updated));
      return updated;
    },

    async getSettings() {
      return read().settings;
    },

    async saveSettings(settings) {
      const parsed = settingsSchema.parse(settings);
      const normalized: Settings = {
        ...parsed,
        blackoutDates: [...new Set(parsed.blackoutDates)].sort(),
      };
      commit({ ...read(), settings: normalized });
      return normalized;
    },

    async resetDemoData() {
      commit(createSeedState());
    },

    subscribe(listener) {
      listeners.add(listener);
      if (!detachExternal && subscribeExternal) {
        detachExternal = subscribeExternal(STORAGE_KEY, () => {
          cachedRaw = null;
          cachedState = null;
          emit();
        });
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && detachExternal) {
          detachExternal();
          detachExternal = null;
        }
      };
    },
  };
}

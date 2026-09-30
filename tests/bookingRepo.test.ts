import { describe, expect, it, vi } from "vitest";
import { getSlotAvailability } from "@/lib/availability";
import { createLocalBookingRepository, STORAGE_KEY } from "@/lib/storage/bookingRepo";
import { createResilientStore, MemoryStorage, type StorageLike } from "@/lib/storage/kvStore";
import { getRestaurantNow } from "@/lib/time";
import { GUEST, TUESDAY_NOON_UTC } from "./helpers";

const FRIDAY = "2026-10-09";

function setup(backend: StorageLike = new MemoryStorage(), extra: { onCorrupt?: () => void } = {}) {
  const onFallback = vi.fn();
  const store = createResilientStore({ getBackend: () => backend, onFallback });
  const repo = createLocalBookingRepository({ store, clock: () => TUESDAY_NOON_UTC, ...extra });
  return { repo, store, backend, onFallback };
}

type Repo = ReturnType<typeof setup>["repo"];

async function remainingTables(repo: Repo, date: string, time: string): Promise<number> {
  const settings = await repo.getSettings();
  const bookings = await repo.listBookings();
  const slot = getSlotAvailability({ settings, bookings, date, now: getRestaurantNow(TUESDAY_NOON_UTC) }).find(
    (candidate) => candidate.time === time,
  );
  return slot?.remaining ?? 0;
}

/** Book every open table in a slot, optionally leaving some free. */
async function fillSlot(repo: Repo, date: string, time: string, leaveFree = 0) {
  const remaining = await remainingTables(repo, date, time);
  for (let index = 0; index < remaining - leaveFree; index += 1) {
    await repo.createBooking({ date, time, partySize: 2, guest: GUEST });
  }
}

async function confirmedBookingAt(repo: Repo, date: string, time: string) {
  const bookings = await repo.listBookingsForDate(date);
  const booking = bookings.find((candidate) => candidate.time === time && candidate.status === "confirmed");
  if (!booking) throw new Error(`No confirmed booking at ${date} ${time}`);
  return booking;
}

describe("local booking repository", () => {
  it("seeds sample data on first use", async () => {
    const { repo, backend } = setup();
    expect(backend.getItem(STORAGE_KEY)).toBeNull();
    const bookings = await repo.listBookings();
    expect(bookings.length).toBeGreaterThan(30);
    expect(backend.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it("creates a confirmed booking with a normalized phone number", async () => {
    const { repo } = setup();
    const booking = await repo.createBooking({ date: FRIDAY, time: "12:00", partySize: 3, guest: GUEST });
    expect(booking.code).toMatch(/^SW-[A-Z2-9]{4}$/);
    expect(booking.status).toBe("confirmed");
    expect(booking.phone).toBe("5125550188");
    expect(await repo.getBookingByCode(booking.code.toLowerCase())).toEqual(booking);
  });

  it("finds a booking only when the code and email match", async () => {
    const { repo } = setup();
    const booking = await repo.createBooking({ date: FRIDAY, time: "12:00", partySize: 2, guest: GUEST });
    expect(await repo.findBookingForGuest(booking.code, "  taylor.brooks@EXAMPLE.com ")).toEqual(booking);
    expect(await repo.findBookingForGuest(booking.code, "someone@example.com")).toBeNull();
    expect(await repo.findBookingForGuest("SW-ZZZZ", GUEST.email)).toBeNull();
  });

  it("re-checks availability on submit when another tab took the last table", async () => {
    const shared = new MemoryStorage();
    const tabA = setup(shared).repo;
    const tabB = setup(shared).repo;

    // Tab A shows one table left at 12:30…
    await fillSlot(tabA, FRIDAY, "12:30", 1);
    expect(await remainingTables(tabA, FRIDAY, "12:30")).toBe(1);

    // …tab B books it first…
    await tabB.createBooking({ date: FRIDAY, time: "12:30", partySize: 2, guest: GUEST });

    // …so tab A's submit fails with the friendly message.
    await expect(tabA.createBooking({ date: FRIDAY, time: "12:30", partySize: 2, guest: GUEST })).rejects.toMatchObject({
      name: "BookingUnavailableError",
      reason: "full",
      message: "That time was just booked. Please pick another time.",
    });
  });

  it("frees the table when a guest cancels", async () => {
    const { repo } = setup();
    await fillSlot(repo, FRIDAY, "13:00");
    await expect(repo.createBooking({ date: FRIDAY, time: "13:00", partySize: 2, guest: GUEST })).rejects.toThrow(
      "That time was just booked",
    );
    const inSlot = await confirmedBookingAt(repo, FRIDAY, "13:00");
    const cancelled = await repo.cancelBooking(inSlot.id);
    expect(cancelled.status).toBe("cancelled");
    await expect(repo.createBooking({ date: FRIDAY, time: "13:00", partySize: 2, guest: GUEST })).resolves.toMatchObject({
      status: "confirmed",
    });
  });

  it("lets a booking in a full slot keep or change its party size in place", async () => {
    const { repo } = setup();
    await fillSlot(repo, FRIDAY, "13:30");
    const own = await confirmedBookingAt(repo, FRIDAY, "13:30");
    const updated = await repo.rescheduleBooking(own.id, { date: FRIDAY, time: "13:30", partySize: 5 });
    expect(updated).toMatchObject({ date: FRIDAY, time: "13:30", partySize: 5 });
  });

  it("refuses to move a booking into a full slot", async () => {
    const { repo } = setup();
    await fillSlot(repo, FRIDAY, "14:00");
    const mine = await repo.createBooking({ date: FRIDAY, time: "12:00", partySize: 2, guest: GUEST });
    await expect(repo.rescheduleBooking(mine.id, { date: FRIDAY, time: "14:00", partySize: 2 })).rejects.toMatchObject({
      reason: "full",
    });
  });

  it("does not let guests change bookings that are no longer upcoming", async () => {
    const { repo } = setup();
    const booking = await repo.createBooking({ date: FRIDAY, time: "12:00", partySize: 2, guest: GUEST });
    await repo.setBookingStatus(booking.id, "seated");
    await expect(repo.cancelBooking(booking.id)).rejects.toMatchObject({ name: "BookingLockedError" });
  });

  it("only restores a cancelled booking if its table is still free", async () => {
    const { repo } = setup();
    const mine = await repo.createBooking({ date: FRIDAY, time: "17:30", partySize: 2, guest: GUEST });
    await repo.setBookingStatus(mine.id, "cancelled");
    await fillSlot(repo, FRIDAY, "17:30");
    await expect(repo.setBookingStatus(mine.id, "confirmed")).rejects.toMatchObject({ reason: "full" });
  });

  it("applies settings to availability right away", async () => {
    const { repo } = setup();
    const settings = await repo.getSettings();
    await repo.saveSettings({ ...settings, blackoutDates: [FRIDAY, FRIDAY] });
    expect((await repo.getSettings()).blackoutDates).toEqual([FRIDAY]);
    await expect(repo.createBooking({ date: FRIDAY, time: "12:00", partySize: 2, guest: GUEST })).rejects.toMatchObject({
      reason: "blackout",
    });
  });

  it("rejects invalid settings", async () => {
    const { repo } = setup();
    const settings = await repo.getSettings();
    const broken = structuredClone(settings);
    broken.weeklyHours[5].lunch.end = "11:00";
    await expect(repo.saveSettings(broken)).rejects.toThrow();
  });

  it("notifies subscribers on every change", async () => {
    const { repo } = setup();
    const listener = vi.fn();
    const unsubscribe = repo.subscribe(listener);
    await repo.createBooking({ date: FRIDAY, time: "12:00", partySize: 2, guest: GUEST });
    await repo.resetDemoData();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it("re-seeds and reports corrupted data", async () => {
    const backend = new MemoryStorage();
    backend.setItem(STORAGE_KEY, "{not json");
    const onCorrupt = vi.fn();
    const { repo } = setup(backend, { onCorrupt });
    expect((await repo.listBookings()).length).toBeGreaterThan(30);
    expect(onCorrupt).toHaveBeenCalledTimes(1);

    backend.setItem(STORAGE_KEY, JSON.stringify({ version: 1, bookings: "nope" }));
    await repo.listBookings();
    expect(onCorrupt).toHaveBeenCalledTimes(2);
  });

  it("falls back to memory when localStorage is blocked", async () => {
    const blocked: StorageLike = {
      getItem: () => {
        throw new DOMException("Blocked", "SecurityError");
      },
      setItem: () => {
        throw new DOMException("Blocked", "SecurityError");
      },
      removeItem: () => {
        throw new DOMException("Blocked", "SecurityError");
      },
    };
    const { repo, store, onFallback } = setup(blocked);
    const booking = await repo.createBooking({ date: FRIDAY, time: "12:00", partySize: 2, guest: GUEST });
    expect(await repo.getBookingByCode(booking.code)).toEqual(booking);
    expect(store.mode).toBe("memory");
    expect(onFallback).toHaveBeenCalledWith("unavailable");
  });

  it("falls back to memory when storage is full", async () => {
    const backend = new MemoryStorage();
    const { repo, store, onFallback } = setup(backend);
    await repo.listBookings();
    backend.setItem = () => {
      throw new DOMException("Full", "QuotaExceededError");
    };
    const booking = await repo.createBooking({ date: FRIDAY, time: "12:00", partySize: 2, guest: GUEST });
    expect(await repo.getBookingByCode(booking.code)).toEqual(booking);
    expect(store.mode).toBe("memory");
    expect(onFallback).toHaveBeenCalledWith("quota");
  });
});

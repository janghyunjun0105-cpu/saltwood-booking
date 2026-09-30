import { describe, expect, it } from "vitest";
import { countTablesTaken, getSlotsForDate } from "@/lib/availability";
import { bookingSchema } from "@/lib/schemas";
import { createSeedBookings, SEED_DAYS } from "@/lib/seed";
import { createDefaultSettings } from "@/lib/settings";
import { addDaysToDateKey, timeToMinutes } from "@/lib/time";
import { TUESDAY_NOON, TUESDAY_NOON_UTC } from "./helpers";

const settings = createDefaultSettings();
const bookings = createSeedBookings({ now: TUESDAY_NOON, settings, instant: TUESDAY_NOON_UTC });

describe("seed data", () => {
  it("creates about 40 valid bookings", () => {
    expect(bookings.length).toBeGreaterThanOrEqual(34);
    expect(bookings.length).toBeLessThanOrEqual(50);
    for (const booking of bookings) expect(bookingSchema.safeParse(booking).success).toBe(true);
  });

  it("covers today through the next 14 days on open days only", () => {
    const last = addDaysToDateKey(TUESDAY_NOON.date, SEED_DAYS);
    for (const booking of bookings) {
      expect(booking.date >= TUESDAY_NOON.date && booking.date <= last).toBe(true);
      expect(getSlotsForDate(settings, booking.date).some((slot) => slot.time === booking.time)).toBe(true);
    }
    expect(bookings.some((booking) => booking.date === TUESDAY_NOON.date)).toBe(true);
  });

  it("never overbooks a slot", () => {
    for (const booking of bookings) {
      expect(countTablesTaken(bookings, booking.date, booking.time)).toBeLessThanOrEqual(settings.tablesPerSlot);
    }
  });

  it("includes one sold-out slot to show a full state", () => {
    const full = bookings.some(
      (booking) => countTablesTaken(bookings, booking.date, booking.time) === settings.tablesPerSlot,
    );
    expect(full).toBe(true);
  });

  it("gives past bookings past statuses and future bookings future ones", () => {
    for (const booking of bookings) {
      const started = booking.date === TUESDAY_NOON.date && timeToMinutes(booking.time) <= TUESDAY_NOON.minutes;
      if (started) expect(booking.status).not.toBe("confirmed");
      else expect(["confirmed", "cancelled"]).toContain(booking.status);
    }
  });

  it("uses unique booking codes", () => {
    expect(new Set(bookings.map((booking) => booking.code)).size).toBe(bookings.length);
  });

  it("is stable for the same day", () => {
    const again = createSeedBookings({ now: TUESDAY_NOON, settings, instant: TUESDAY_NOON_UTC });
    expect(again).toEqual(bookings);
  });
});

import type { Booking, GuestDetails } from "@/lib/schemas";
import type { RestaurantNow } from "@/lib/time";

let counter = 0;

/** A valid booking with sensible defaults. Override only what a test cares about. */
export function makeBooking(overrides: Partial<Booking> = {}): Booking {
  counter += 1;
  return {
    id: `bk_test${counter}`,
    code: "SW-AB2C",
    date: "2026-10-09",
    time: "19:00",
    partySize: 2,
    firstName: "Jamie",
    lastName: "Rivera",
    email: "jamie.rivera@example.com",
    phone: "5125550123",
    occasion: "none",
    specialRequests: "",
    smsReminder: false,
    status: "confirmed",
    createdAt: "2026-10-01T15:00:00.000Z",
    updatedAt: "2026-10-01T15:00:00.000Z",
    ...overrides,
  };
}

export function makeBookings(count: number, overrides: Partial<Booking> = {}): Booking[] {
  return Array.from({ length: count }, () => makeBooking(overrides));
}

export const GUEST: GuestDetails = {
  firstName: "Taylor",
  lastName: "Brooks",
  email: "Taylor.Brooks@example.com",
  phone: "(512) 555-0188",
  occasion: "birthday",
  specialRequests: "Window seat, please.",
  smsReminder: true,
};

/** Tuesday, October 6, 2026 at noon in Chicago. */
export const TUESDAY_NOON_UTC = new Date("2026-10-06T17:00:00.000Z");
export const TUESDAY_NOON: RestaurantNow = { date: "2026-10-06", minutes: 12 * 60 };

export function at(date: string, time: string): RestaurantNow {
  const [hours, minutes] = time.split(":").map(Number);
  return { date, minutes: hours * 60 + minutes };
}

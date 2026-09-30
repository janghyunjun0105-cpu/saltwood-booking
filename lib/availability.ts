/**
 * Booking rules as pure functions. Nothing here reads the clock or storage:
 * callers pass settings, bookings and the restaurant's "now", which keeps the
 * rules easy to test and identical on every screen that uses them.
 */
import type { Booking, Service, ServiceWindow, Settings } from "@/lib/schemas";
import {
  addDaysToDateKey,
  minutesToTime,
  timeToMinutes,
  weekdayOf,
  type DateKey,
  type RestaurantNow,
  type TimeKey,
} from "@/lib/time";
import { RESTAURANT } from "@/lib/restaurant";

/** A slot must start at least this many minutes from now to be bookable. */
export const LEAD_TIME_MINUTES = 30;
/** Guests can book today plus this many days ahead. */
export const BOOKING_WINDOW_DAYS = 30;

export interface SlotDefinition {
  time: TimeKey;
  service: Service;
}

export type SlotState = "available" | "full" | "past";

export interface SlotAvailability extends SlotDefinition {
  remaining: number;
  state: SlotState;
}

export type DateClosure = "closed" | "blackout";

export type DateState = "open" | DateClosure | "full" | "past";

export interface DateAvailability {
  date: DateKey;
  state: DateState;
  availableSlots: number;
}

export type BookingCheckFailure =
  | "party_size"
  | "past"
  | "out_of_window"
  | "closed"
  | "blackout"
  | "invalid_time"
  | "full";

export type BookingCheck = { ok: true } | { ok: false; reason: BookingCheckFailure };

export const BOOKING_CHECK_MESSAGES: Record<BookingCheckFailure, string> = {
  full: "That time was just booked. Please pick another time.",
  past: "That time is too soon or has already passed. Please pick a later time.",
  closed: "We're closed on that day. Please pick another date.",
  blackout: "We're closed on that date. Please pick another date.",
  invalid_time: "That time isn't available. Please pick another time.",
  out_of_window: `We take bookings up to ${BOOKING_WINDOW_DAYS} days ahead. Please pick an earlier date.`,
  party_size: `For larger parties, please call us at ${RESTAURANT.phoneDisplay}.`,
};

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

export function getDateClosure(settings: Settings, date: DateKey): DateClosure | null {
  if (settings.blackoutDates.includes(date)) return "blackout";
  const day = settings.weeklyHours[weekdayOf(date)];
  if (day.closed || (!day.lunch.enabled && !day.dinner.enabled)) return "closed";
  return null;
}

export function isDateClosed(settings: Settings, date: DateKey): boolean {
  return getDateClosure(settings, date) !== null;
}

export function getBookingWindow(now: RestaurantNow): { first: DateKey; last: DateKey } {
  return { first: now.date, last: addDaysToDateKey(now.date, BOOKING_WINDOW_DAYS) };
}

export function isWithinBookingWindow(date: DateKey, now: RestaurantNow): boolean {
  const { first, last } = getBookingWindow(now);
  return date >= first && date <= last;
}

/* ------------------------------------------------------------------ */
/* Slots                                                               */
/* ------------------------------------------------------------------ */

/** Seating times from the first seating to the last seating, inclusive. */
export function getServiceTimes(window: ServiceWindow, intervalMinutes: number): TimeKey[] {
  if (!window.enabled) return [];
  const start = timeToMinutes(window.start);
  const end = timeToMinutes(window.end);
  const times: TimeKey[] = [];
  for (let minutes = start; minutes <= end; minutes += intervalMinutes) {
    times.push(minutesToTime(minutes));
  }
  return times;
}

export function getSlotsForDate(settings: Settings, date: DateKey): SlotDefinition[] {
  if (isDateClosed(settings, date)) return [];
  const day = settings.weeklyHours[weekdayOf(date)];
  return [
    ...getServiceTimes(day.lunch, settings.slotIntervalMinutes).map((time) => ({ time, service: "lunch" as const })),
    ...getServiceTimes(day.dinner, settings.slotIntervalMinutes).map((time) => ({ time, service: "dinner" as const })),
  ];
}

/** Every booking holds one table unless it was cancelled. */
export function holdsTable(booking: Booking): boolean {
  return booking.status !== "cancelled";
}

export function countTablesTaken(
  bookings: readonly Booking[],
  date: DateKey,
  time: TimeKey,
  excludeBookingId?: string,
): number {
  return bookings.filter(
    (booking) =>
      booking.date === date && booking.time === time && booking.id !== excludeBookingId && holdsTable(booking),
  ).length;
}

/** True when the slot has started or starts within the lead time. */
export function isSlotTooSoon(date: DateKey, time: TimeKey, now: RestaurantNow): boolean {
  if (date < now.date) return true;
  if (date > now.date) return false;
  return timeToMinutes(time) - now.minutes < LEAD_TIME_MINUTES;
}

interface AvailabilityParams {
  settings: Settings;
  bookings: readonly Booking[];
  now: RestaurantNow;
  /** Leave a booking's own table out of the count, so it can move to (or stay in) its current slot. */
  excludeBookingId?: string;
}

export function getSlotAvailability({
  settings,
  bookings,
  date,
  now,
  excludeBookingId,
}: AvailabilityParams & { date: DateKey }): SlotAvailability[] {
  return getSlotsForDate(settings, date).map((slot) => {
    const taken = countTablesTaken(bookings, date, slot.time, excludeBookingId);
    const remaining = Math.max(0, settings.tablesPerSlot - taken);
    const state: SlotState = isSlotTooSoon(date, slot.time, now) ? "past" : remaining === 0 ? "full" : "available";
    return { ...slot, remaining, state };
  });
}

export function getDateAvailability(params: AvailabilityParams & { date: DateKey }): DateAvailability {
  const { settings, date } = params;
  const closure = getDateClosure(settings, date);
  if (closure) return { date, state: closure, availableSlots: 0 };

  const slots = getSlotAvailability(params);
  const availableSlots = slots.filter((slot) => slot.state === "available").length;
  if (availableSlots > 0) return { date, state: "open", availableSlots };
  const allPast = slots.every((slot) => slot.state === "past");
  return { date, state: allPast ? "past" : "full", availableSlots: 0 };
}

/** Today plus the next BOOKING_WINDOW_DAYS days, each with its availability. */
export function getBookableDates(params: AvailabilityParams): DateAvailability[] {
  const dates: DateAvailability[] = [];
  for (let offset = 0; offset <= BOOKING_WINDOW_DAYS; offset += 1) {
    dates.push(getDateAvailability({ ...params, date: addDaysToDateKey(params.now.date, offset) }));
  }
  return dates;
}

/* ------------------------------------------------------------------ */
/* The final gate                                                      */
/* ------------------------------------------------------------------ */

/** Runs every rule for one slot. The repository calls this again at submit time. */
export function checkSlotBookable({
  settings,
  bookings,
  date,
  time,
  partySize,
  now,
  excludeBookingId,
}: AvailabilityParams & { date: DateKey; time: TimeKey; partySize: number }): BookingCheck {
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > settings.maxPartySize) {
    return { ok: false, reason: "party_size" };
  }
  if (date < now.date) return { ok: false, reason: "past" };
  if (!isWithinBookingWindow(date, now)) return { ok: false, reason: "out_of_window" };

  const closure = getDateClosure(settings, date);
  if (closure) return { ok: false, reason: closure };

  if (!getSlotsForDate(settings, date).some((slot) => slot.time === time)) {
    return { ok: false, reason: "invalid_time" };
  }
  if (isSlotTooSoon(date, time, now)) return { ok: false, reason: "past" };
  if (countTablesTaken(bookings, date, time, excludeBookingId) >= settings.tablesPerSlot) {
    return { ok: false, reason: "full" };
  }
  return { ok: true };
}

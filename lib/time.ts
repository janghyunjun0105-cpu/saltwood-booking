import { addDays, format, getDay, isValid } from "date-fns";
import { RESTAURANT } from "@/lib/restaurant";

/**
 * All dates and times in the app are stored in restaurant time (America/Chicago):
 * dates as "YYYY-MM-DD" and times as "HH:mm" (24-hour). They are only converted
 * for display, or to a real instant when writing a calendar file.
 */
export type DateKey = string;
export type TimeKey = string;

export const RESTAURANT_TIME_ZONE = RESTAURANT.timeZone;

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_KEY_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/**
 * Turns a date key into a Date at local midnight. The Date is only used for
 * calendar math and formatting, so the viewer's own time zone never shifts the day.
 */
export function parseDateKey(key: DateKey): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toDateKey(date: Date): DateKey {
  return format(date, "yyyy-MM-dd");
}

export function isDateKey(value: string): boolean {
  if (!DATE_KEY_PATTERN.test(value)) return false;
  const date = parseDateKey(value);
  return isValid(date) && toDateKey(date) === value;
}

export function isTimeKey(value: string): boolean {
  return TIME_KEY_PATTERN.test(value);
}

export function addDaysToDateKey(key: DateKey, days: number): DateKey {
  return toDateKey(addDays(parseDateKey(key), days));
}

/** 0 = Sunday … 6 = Saturday */
export function weekdayOf(key: DateKey): number {
  return getDay(parseDateKey(key));
}

export function timeToMinutes(time: TimeKey): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): TimeKey {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export interface RestaurantNow {
  /** Today's date in restaurant time. */
  date: DateKey;
  /** Minutes since midnight in restaurant time. */
  minutes: number;
}

let clockFormatter: Intl.DateTimeFormat | null = null;

/** One cached formatter: creating Intl formatters is slow, reusing one is cheap. */
function restaurantClock(): Intl.DateTimeFormat {
  clockFormatter ??= new Intl.DateTimeFormat("en-US", {
    timeZone: RESTAURANT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return clockFormatter;
}

function restaurantParts(instant: Date) {
  const parts: Record<string, number> = {};
  for (const part of restaurantClock().formatToParts(instant)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  return parts as { year: number; month: number; day: number; hour: number; minute: number };
}

/** The current date and time as seen from the restaurant's clock, wherever the viewer is. */
export function getRestaurantNow(instant: Date = new Date()): RestaurantNow {
  const { year, month, day, hour, minute } = restaurantParts(instant);
  return {
    date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    minutes: hour * 60 + minute,
  };
}

/** Converts a restaurant-time date + time to the real instant it happens at. */
export function restaurantTimeToInstant(date: DateKey, time: TimeKey): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hours, minutes);
  // Guess with the offset at that moment, then correct once in case a DST change sits in between.
  let instant = wallClockAsUtc - offsetMinutes(new Date(wallClockAsUtc)) * 60_000;
  instant = wallClockAsUtc - offsetMinutes(new Date(instant)) * 60_000;
  return new Date(instant);
}

/** Restaurant UTC offset in minutes at an instant (e.g. -300 for CDT). */
function offsetMinutes(instant: Date): number {
  const { year, month, day, hour, minute } = restaurantParts(instant);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  return Math.round((asUtc - Math.floor(instant.getTime() / 60_000) * 60_000) / 60_000);
}

/** "Fri, Oct 9" */
export function formatDateShort(key: DateKey): string {
  return format(parseDateKey(key), "EEE, MMM d");
}

/** "Friday, October 9" */
export function formatDateLong(key: DateKey): string {
  return format(parseDateKey(key), "EEEE, MMMM d");
}

/** "Fri, Oct 9, 2026" */
export function formatDateWithYear(key: DateKey): string {
  return format(parseDateKey(key), "EEE, MMM d, yyyy");
}

/** "6:30 PM" */
export function formatTime(time: TimeKey): string {
  const total = timeToMinutes(time);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}

/** "11:30 AM – 2:00 PM" */
export function formatTimeRange(start: TimeKey, end: TimeKey): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/** Strips formatting from a US phone number. Returns 10 digits, or null if it isn't one. */
export function normalizeUsPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length !== 10) return null;
  // Area codes and exchanges never start with 0 or 1 in the North American Numbering Plan.
  if (/^[01]/.test(digits) || /^[01]/.test(digits.slice(3))) return null;
  return digits;
}

/** "(512) 555-0147" */
export function formatUsPhone(digits: string): string {
  if (!/^\d{10}$/.test(digits)) return digits;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** "1 guest", "4 guests" */
export function formatPartySize(size: number): string {
  return `${size} ${size === 1 ? "guest" : "guests"}`;
}

/**
 * Builds an iCalendar (RFC 5545) file for a booking, entirely on the client.
 * Times are written in UTC so every calendar app places the event correctly.
 */
import { FULL_ADDRESS, RESTAURANT } from "@/lib/restaurant";
import type { Booking } from "@/lib/schemas";
import { formatPartySize, restaurantTimeToInstant } from "@/lib/time";

/** How long a table is held on the calendar. */
export const DINING_DURATION_MINUTES = 90;

function toIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Escapes text values: backslash, semicolon, comma and newlines. */
export function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Folds a content line to 75 octets per line, as the spec requires. */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    // Continuation lines start with a space, which counts toward their 75.
    const limit = parts.length === 0 ? 75 : 74;
    if (currentBytes + bytes > limit) {
      parts.push(current);
      current = "";
      currentBytes = 0;
    }
    current += char;
    currentBytes += bytes;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

interface IcsOptions {
  /** DTSTAMP. Defaults to now. */
  stamp?: Date;
  /** Link to the manage page, included in the description. */
  manageUrl?: string;
}

export function buildBookingIcs(booking: Booking, { stamp = new Date(), manageUrl }: IcsOptions = {}): string {
  const start = restaurantTimeToInstant(booking.date, booking.time);
  const end = new Date(start.getTime() + DINING_DURATION_MINUTES * 60 * 1000);

  const description = [
    `Booking code: ${booking.code}`,
    `Party: ${formatPartySize(booking.partySize)}`,
    `Name: ${booking.firstName} ${booking.lastName}`,
    booking.specialRequests ? `Requests: ${booking.specialRequests}` : null,
    manageUrl ? `Change or cancel: ${manageUrl}` : null,
    `Questions? Call ${RESTAURANT.phoneDisplay}.`,
  ]
    .filter(Boolean)
    .join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Saltwood Kitchen//Table Booking Demo//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${booking.id}@saltwood-kitchen.demo`,
    `DTSTAMP:${toIcsUtc(stamp)}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcsText(`Table for ${booking.partySize} at ${RESTAURANT.name}`)}`,
    `LOCATION:${escapeIcsText(`${RESTAURANT.name}, ${FULL_ADDRESS}`)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    manageUrl ? `URL:${manageUrl}` : null,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:-PT2H",
    `DESCRIPTION:${escapeIcsText(`Your table at ${RESTAURANT.name} is in 2 hours`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => line !== null);

  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

export function icsFileName(booking: Booking): string {
  return `saltwood-kitchen-${booking.code.toLowerCase()}.ics`;
}

/** Triggers a download (or the "Add to Calendar" sheet on iOS) without a server. */
export function downloadIcs(fileName: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

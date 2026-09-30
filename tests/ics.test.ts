import { describe, expect, it } from "vitest";
import { buildBookingIcs, escapeIcsText, foldIcsLine, icsFileName } from "@/lib/ics";
import { makeBooking } from "./helpers";

describe("calendar file", () => {
  const booking = makeBooking({
    code: "SW-7K3M",
    date: "2026-10-09",
    time: "18:30",
    partySize: 4,
    specialRequests: "Window seat, please; it's our anniversary.",
  });
  const ics = buildBookingIcs(booking, {
    stamp: new Date("2026-10-01T12:00:00Z"),
    manageUrl: "https://saltwood.example/manage?code=SW-7K3M",
  });

  it("writes start and end times in UTC", () => {
    // 6:30 PM Central Daylight Time is 23:30 UTC; 90 minutes later is 01:00 UTC the next day.
    expect(ics).toContain("DTSTART:20261009T233000Z");
    expect(ics).toContain("DTEND:20261010T010000Z");
    expect(ics).toContain("DTSTAMP:20261001T120000Z");
  });

  it("includes the booking details", () => {
    expect(ics).toContain("SUMMARY:Table for 4 at Saltwood Kitchen");
    expect(ics).toContain("LOCATION:Saltwood Kitchen\\, 123 Main St\\, Austin\\, TX 78701");
    expect(ics.replace(/\r\n /g, "")).toContain("Booking code: SW-7K3M");
    expect(ics).toContain("BEGIN:VALARM");
  });

  it("uses CRLF line endings and folds long lines to 75 octets", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    for (const line of ics.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it("escapes special characters", () => {
    expect(escapeIcsText("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne");
  });

  it("folds multi-byte text without splitting characters", () => {
    const folded = foldIcsLine(`DESCRIPTION:${"café ".repeat(30)}`);
    for (const line of folded.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(folded.replace(/\r\n /g, "")).toBe(`DESCRIPTION:${"café ".repeat(30)}`);
  });

  it("names the file after the booking code", () => {
    expect(icsFileName(booking)).toBe("saltwood-kitchen-sw-7k3m.ics");
  });
});

import { describe, expect, it } from "vitest";
import {
  addDaysToDateKey,
  formatDateLong,
  formatDateShort,
  formatPartySize,
  formatTime,
  formatTimeRange,
  formatUsPhone,
  getRestaurantNow,
  isDateKey,
  isTimeKey,
  minutesToTime,
  normalizeUsPhone,
  restaurantTimeToInstant,
  timeToMinutes,
  weekdayOf,
} from "@/lib/time";

describe("date keys", () => {
  it("validates real calendar dates only", () => {
    expect(isDateKey("2026-10-09")).toBe(true);
    expect(isDateKey("2026-02-30")).toBe(false);
    expect(isDateKey("2026-1-9")).toBe(false);
    expect(isDateKey("not a date")).toBe(false);
  });

  it("adds days across month and year boundaries", () => {
    expect(addDaysToDateKey("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDaysToDateKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToDateKey("2026-03-08", 1)).toBe("2026-03-09"); // US DST starts
    expect(addDaysToDateKey("2026-11-01", -1)).toBe("2026-10-31"); // US DST ends
  });

  it("finds the weekday regardless of the viewer's time zone", () => {
    expect(weekdayOf("2026-10-09")).toBe(5); // Friday
    expect(weekdayOf("2026-10-12")).toBe(1); // Monday
  });
});

describe("time keys", () => {
  it("validates 24-hour HH:mm strings", () => {
    expect(isTimeKey("18:30")).toBe(true);
    expect(isTimeKey("24:00")).toBe(false);
    expect(isTimeKey("6:30")).toBe(false);
  });

  it("converts between minutes and time keys", () => {
    expect(timeToMinutes("11:30")).toBe(690);
    expect(minutesToTime(690)).toBe("11:30");
    expect(minutesToTime(timeToMinutes("21:05"))).toBe("21:05");
  });
});

describe("restaurant clock", () => {
  it("reports Chicago time during daylight saving time (UTC-5)", () => {
    expect(getRestaurantNow(new Date("2026-10-09T23:30:00Z"))).toEqual({ date: "2026-10-09", minutes: 18 * 60 + 30 });
  });

  it("reports Chicago time during standard time (UTC-6)", () => {
    expect(getRestaurantNow(new Date("2026-01-15T18:00:00Z"))).toEqual({ date: "2026-01-15", minutes: 12 * 60 });
  });

  it("stays on the previous day late at night in Chicago", () => {
    expect(getRestaurantNow(new Date("2026-10-10T04:45:00Z"))).toEqual({ date: "2026-10-09", minutes: 23 * 60 + 45 });
  });

  it("converts restaurant time to a real instant", () => {
    expect(restaurantTimeToInstant("2026-10-09", "18:30").toISOString()).toBe("2026-10-09T23:30:00.000Z");
    expect(restaurantTimeToInstant("2026-01-15", "12:00").toISOString()).toBe("2026-01-15T18:00:00.000Z");
  });
});

describe("US display formats", () => {
  it("formats dates like Fri, Oct 9", () => {
    expect(formatDateShort("2026-10-09")).toBe("Fri, Oct 9");
    expect(formatDateLong("2026-10-09")).toBe("Friday, October 9");
  });

  it("formats 12-hour times", () => {
    expect(formatTime("18:30")).toBe("6:30 PM");
    expect(formatTime("12:00")).toBe("12:00 PM");
    expect(formatTime("00:15")).toBe("12:15 AM");
    expect(formatTime("11:30")).toBe("11:30 AM");
    expect(formatTimeRange("11:30", "14:00")).toBe("11:30 AM – 2:00 PM");
  });

  it("normalizes and formats US phone numbers", () => {
    expect(normalizeUsPhone("(512) 555-0147")).toBe("5125550147");
    expect(normalizeUsPhone("+1 512.555.0147")).toBe("5125550147");
    expect(normalizeUsPhone("555-0147")).toBeNull();
    expect(normalizeUsPhone("(012) 555-0147")).toBeNull();
    expect(formatUsPhone("5125550147")).toBe("(512) 555-0147");
  });

  it("pluralizes party sizes", () => {
    expect(formatPartySize(1)).toBe("1 guest");
    expect(formatPartySize(4)).toBe("4 guests");
  });
});

describe("daylight saving edges in Chicago", () => {
  it("handles the spring-forward day", () => {
    // March 8, 2026: 2:00 AM jumps to 3:00 AM (CST -6 → CDT -5).
    expect(restaurantTimeToInstant("2026-03-08", "01:30").toISOString()).toBe("2026-03-08T07:30:00.000Z");
    expect(restaurantTimeToInstant("2026-03-08", "18:30").toISOString()).toBe("2026-03-08T23:30:00.000Z");
    expect(getRestaurantNow(new Date("2026-03-08T08:30:00Z"))).toEqual({ date: "2026-03-08", minutes: 3 * 60 + 30 });
  });

  it("handles the fall-back day", () => {
    // November 1, 2026: 2:00 AM falls back to 1:00 AM (CDT -5 → CST -6).
    expect(restaurantTimeToInstant("2026-11-01", "18:30").toISOString()).toBe("2026-11-02T00:30:00.000Z");
    expect(getRestaurantNow(new Date("2026-11-01T12:00:00Z"))).toEqual({ date: "2026-11-01", minutes: 6 * 60 });
  });
});

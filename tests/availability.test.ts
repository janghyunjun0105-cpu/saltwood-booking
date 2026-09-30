import { describe, expect, it } from "vitest";
import {
  BOOKING_CHECK_MESSAGES,
  BOOKING_WINDOW_DAYS,
  checkSlotBookable,
  getBookableDates,
  getDateAvailability,
  getDateClosure,
  getServiceTimes,
  getSlotAvailability,
  getSlotsForDate,
} from "@/lib/availability";
import type { Settings } from "@/lib/schemas";
import { createDefaultSettings } from "@/lib/settings";
import { at, makeBooking, makeBookings, TUESDAY_NOON } from "./helpers";

const FRIDAY = "2026-10-09";
const MONDAY = "2026-10-12";

function settingsWith(overrides: Partial<Settings> = {}): Settings {
  return { ...createDefaultSettings(), ...overrides };
}

function slot(date: string, time: string, bookings = [makeBooking()].slice(0, 0), now = TUESDAY_NOON, settings = settingsWith()) {
  return getSlotAvailability({ settings, bookings, date, now }).find((candidate) => candidate.time === time);
}

describe("slot generation", () => {
  it("builds lunch and dinner seatings from the default hours", () => {
    const slots = getSlotsForDate(settingsWith(), FRIDAY);
    const lunch = slots.filter((candidate) => candidate.service === "lunch").map((candidate) => candidate.time);
    const dinner = slots.filter((candidate) => candidate.service === "dinner").map((candidate) => candidate.time);

    expect(lunch).toEqual(["11:30", "12:00", "12:30", "13:00", "13:30", "14:00"]);
    expect(dinner[0]).toBe("17:00");
    expect(dinner.at(-1)).toBe("21:30"); // window end is the last seating
    expect(dinner).toHaveLength(10);
  });

  it("follows the slot interval setting", () => {
    expect(getServiceTimes({ enabled: true, start: "11:30", end: "12:30" }, 15)).toEqual([
      "11:30",
      "11:45",
      "12:00",
      "12:15",
      "12:30",
    ]);
  });

  it("skips a service that is turned off", () => {
    const settings = settingsWith();
    settings.weeklyHours[5] = { ...settings.weeklyHours[5], lunch: { ...settings.weeklyHours[5].lunch, enabled: false } };
    expect(getSlotsForDate(settings, FRIDAY).every((candidate) => candidate.service === "dinner")).toBe(true);
  });
});

describe("closed days", () => {
  it("has no slots on Mondays with the default hours", () => {
    const settings = settingsWith();
    expect(getDateClosure(settings, MONDAY)).toBe("closed");
    expect(getSlotsForDate(settings, MONDAY)).toEqual([]);
    expect(
      checkSlotBookable({ settings, bookings: [], date: MONDAY, time: "19:00", partySize: 2, now: TUESDAY_NOON }),
    ).toEqual({ ok: false, reason: "closed" });
  });

  it("treats a day with both services off as closed", () => {
    const settings = settingsWith();
    const friday = settings.weeklyHours[5];
    settings.weeklyHours[5] = {
      closed: false,
      lunch: { ...friday.lunch, enabled: false },
      dinner: { ...friday.dinner, enabled: false },
    };
    expect(getDateClosure(settings, FRIDAY)).toBe("closed");
  });
});

describe("blackout dates", () => {
  it("blocks a blacked-out date even when the weekday is open", () => {
    const settings = settingsWith({ blackoutDates: [FRIDAY] });
    expect(getDateClosure(settings, FRIDAY)).toBe("blackout");
    expect(getSlotsForDate(settings, FRIDAY)).toEqual([]);
    expect(getDateAvailability({ settings, bookings: [], date: FRIDAY, now: TUESDAY_NOON }).state).toBe("blackout");
    expect(
      checkSlotBookable({ settings, bookings: [], date: FRIDAY, time: "19:00", partySize: 2, now: TUESDAY_NOON }),
    ).toEqual({ ok: false, reason: "blackout" });
  });
});

describe("past slots and lead time", () => {
  const today = TUESDAY_NOON.date;

  it("marks earlier slots today as past", () => {
    expect(slot(today, "11:30")?.state).toBe("past");
    expect(slot(today, "12:00")?.state).toBe("past");
    expect(slot(today, "13:00")?.state).toBe("available");
  });

  it("requires a slot to start at least 30 minutes from now", () => {
    // Exactly 30 minutes ahead is allowed…
    expect(slot(today, "12:30", [], at(today, "12:00"))?.state).toBe("available");
    // …29 minutes ahead is not.
    expect(slot(today, "12:30", [], at(today, "12:01"))?.state).toBe("past");
    expect(
      checkSlotBookable({
        settings: settingsWith(),
        bookings: [],
        date: today,
        time: "12:30",
        partySize: 2,
        now: at(today, "12:01"),
      }),
    ).toEqual({ ok: false, reason: "past" });
  });

  it("rejects dates before today", () => {
    expect(
      checkSlotBookable({
        settings: settingsWith(),
        bookings: [],
        date: "2026-10-04",
        time: "19:00",
        partySize: 2,
        now: TUESDAY_NOON,
      }),
    ).toEqual({ ok: false, reason: "past" });
  });

  it("marks today as past once the last seating is inside the lead time", () => {
    const lateNight = at(today, "21:10");
    expect(getDateAvailability({ settings: settingsWith(), bookings: [], date: today, now: lateNight }).state).toBe(
      "past",
    );
  });
});

describe("capacity", () => {
  it("counts remaining tables per slot", () => {
    const bookings = makeBookings(4, { date: FRIDAY, time: "19:00" });
    expect(slot(FRIDAY, "19:00", bookings)?.remaining).toBe(2);
    expect(slot(FRIDAY, "19:30", bookings)?.remaining).toBe(6);
  });

  it("marks a slot full when every table is taken", () => {
    const bookings = makeBookings(6, { date: FRIDAY, time: "19:00" });
    expect(slot(FRIDAY, "19:00", bookings)).toMatchObject({ remaining: 0, state: "full" });
    const check = checkSlotBookable({
      settings: settingsWith(),
      bookings,
      date: FRIDAY,
      time: "19:00",
      partySize: 2,
      now: TUESDAY_NOON,
    });
    expect(check).toEqual({ ok: false, reason: "full" });
    expect(BOOKING_CHECK_MESSAGES.full).toBe("That time was just booked. Please pick another time.");
  });

  it("follows the tables-per-slot setting", () => {
    const bookings = makeBookings(2, { date: FRIDAY, time: "19:00" });
    expect(slot(FRIDAY, "19:00", bookings, TUESDAY_NOON, settingsWith({ tablesPerSlot: 2 }))?.state).toBe("full");
  });

  it("frees a table when a booking is cancelled", () => {
    const bookings = makeBookings(6, { date: FRIDAY, time: "19:00" });
    bookings[0] = { ...bookings[0], status: "cancelled" };
    expect(slot(FRIDAY, "19:00", bookings)).toMatchObject({ remaining: 1, state: "available" });
    expect(
      checkSlotBookable({ settings: settingsWith(), bookings, date: FRIDAY, time: "19:00", partySize: 2, now: TUESDAY_NOON }),
    ).toEqual({ ok: true });
  });

  it("still counts seated, completed and no-show bookings", () => {
    const bookings = [
      makeBooking({ date: FRIDAY, time: "19:00", status: "seated" }),
      makeBooking({ date: FRIDAY, time: "19:00", status: "completed" }),
      makeBooking({ date: FRIDAY, time: "19:00", status: "no_show" }),
    ];
    expect(slot(FRIDAY, "19:00", bookings)?.remaining).toBe(3);
  });

  it("excludes a booking's own table when rescheduling", () => {
    const bookings = makeBookings(6, { date: FRIDAY, time: "19:00" });
    const own = bookings[2];
    const params = { settings: settingsWith(), bookings, date: FRIDAY, time: "19:00", partySize: 4, now: TUESDAY_NOON };

    expect(checkSlotBookable(params)).toEqual({ ok: false, reason: "full" });
    expect(checkSlotBookable({ ...params, excludeBookingId: own.id })).toEqual({ ok: true });
    expect(
      getSlotAvailability({ ...params, excludeBookingId: own.id }).find((candidate) => candidate.time === "19:00"),
    ).toMatchObject({ remaining: 1, state: "available" });
  });
});

describe("booking window and party size", () => {
  it("allows today plus the next 30 days", () => {
    const dates = getBookableDates({ settings: settingsWith(), bookings: [], now: TUESDAY_NOON });
    expect(dates).toHaveLength(BOOKING_WINDOW_DAYS + 1);
    expect(dates[0].date).toBe("2026-10-06");
    expect(dates.at(-1)?.date).toBe("2026-11-05");
    expect(dates.find((day) => day.date === MONDAY)?.state).toBe("closed");
  });

  it("rejects dates past the booking window", () => {
    const base = { settings: settingsWith(), bookings: [], time: "19:00", partySize: 2, now: TUESDAY_NOON };
    expect(checkSlotBookable({ ...base, date: "2026-11-05" })).toEqual({ ok: true }); // Thursday, day 30
    expect(checkSlotBookable({ ...base, date: "2026-11-06" })).toEqual({ ok: false, reason: "out_of_window" });
  });

  it("rejects party sizes above the max", () => {
    const base = { settings: settingsWith(), bookings: [], date: FRIDAY, time: "19:00", now: TUESDAY_NOON };
    expect(checkSlotBookable({ ...base, partySize: 8 })).toEqual({ ok: true });
    expect(checkSlotBookable({ ...base, partySize: 9 })).toEqual({ ok: false, reason: "party_size" });
    expect(checkSlotBookable({ ...base, partySize: 0 })).toEqual({ ok: false, reason: "party_size" });
  });

  it("rejects times that aren't a seating", () => {
    expect(
      checkSlotBookable({
        settings: settingsWith(),
        bookings: [],
        date: FRIDAY,
        time: "15:00",
        partySize: 2,
        now: TUESDAY_NOON,
      }),
    ).toEqual({ ok: false, reason: "invalid_time" });
  });

  it("marks a date full when every remaining slot is taken", () => {
    const settings = settingsWith({ tablesPerSlot: 1 });
    const bookings = getSlotsForDate(settings, FRIDAY).map((candidate) =>
      makeBooking({ date: FRIDAY, time: candidate.time }),
    );
    expect(getDateAvailability({ settings, bookings, date: FRIDAY, now: TUESDAY_NOON }).state).toBe("full");
  });
});

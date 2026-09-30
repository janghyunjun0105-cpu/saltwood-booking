/**
 * Sample bookings for the demo. Everything is generated relative to "today"
 * in restaurant time, so the dashboard always shows a believable week ahead.
 * A seeded PRNG makes the data stable for a given day.
 */
import { countTablesTaken, getSlotsForDate, type SlotDefinition } from "@/lib/availability";
import { generateUniqueBookingCode } from "@/lib/bookingCode";
import {
  createId,
  hashString,
  mulberry32,
  pickOne,
  pickWeighted,
  randomInt,
  type RandomSource,
} from "@/lib/random";
import type { Booking, BookingStatus, Occasion, Settings } from "@/lib/schemas";
import { addDaysToDateKey, timeToMinutes, weekdayOf, type DateKey, type RestaurantNow } from "@/lib/time";

export const SEED_DAYS = 14;

const FIRST_NAMES = [
  "Olivia", "Liam", "Emma", "Noah", "Ava", "Elijah", "Sophia", "James", "Isabella", "Lucas",
  "Mia", "Mason", "Harper", "Ethan", "Evelyn", "Logan", "Abigail", "Jackson", "Emily", "Aiden",
  "Madison", "Caleb", "Chloe", "Wyatt", "Grace", "Carter", "Zoe", "Jayden", "Lily", "Owen",
  "Hannah", "Mateo", "Nora", "Isaiah", "Riley", "Gabriel", "Layla", "Marcus", "Camila", "Tyler",
];

const LAST_NAMES = [
  "Johnson", "Martinez", "Nguyen", "Williams", "Garcia", "Brown", "Davis", "Rodriguez", "Miller", "Wilson",
  "Anderson", "Thomas", "Hernandez", "Moore", "Jackson", "Lee", "Thompson", "White", "Lopez", "Harris",
  "Clark", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres",
  "Patel", "Hill", "Flores", "Green", "Adams", "Baker", "Carter", "Mitchell", "Rivera", "Campbell",
];

const GENERAL_REQUESTS = [
  "Booth if you have one, please.",
  "One guest is gluten-free.",
  "We'll need a high chair.",
  "Allergic to tree nuts.",
  "Quiet table, please — we're catching up.",
  "Patio if the weather is nice.",
  "Running about 10 minutes late, sorry!",
  "Vegetarian in our party.",
  "Wheelchair-accessible seating, please.",
];

const OCCASION_REQUESTS: Partial<Record<Occasion, string[]>> = {
  birthday: ["Birthday dinner — a candle on dessert would be lovely.", "It's my mom's 60th!"],
  anniversary: ["Celebrating 10 years. Window table if possible.", "Our first anniversary."],
  business: ["Client dinner. We'd appreciate a quieter spot.", "Need to be out by 1:15."],
};

/** Typical bookings per weekday (Sun … Sat). Mondays are closed by default. */
const DAILY_TARGET = [2, 0, 1, 1, 2, 3, 3];

const PARTY_SIZES: ReadonlyArray<readonly [number, number]> = [
  [1, 5], [2, 40], [3, 12], [4, 22], [5, 8], [6, 7], [7, 2], [8, 4],
];

const OCCASIONS: ReadonlyArray<readonly [Occasion, number]> = [
  ["none", 74], ["birthday", 10], ["anniversary", 8], ["business", 6], ["other", 2],
];

interface SeedOptions {
  now: RestaurantNow;
  settings: Settings;
  /** The real instant for createdAt / updatedAt timestamps. */
  instant: Date;
  random?: RandomSource;
}

export function createSeedBookings({ now, settings, instant, random }: SeedOptions): Booking[] {
  const rand = random ?? mulberry32(hashString(`saltwood:${now.date}`));
  const bookings: Booking[] = [];

  function slotWeight(slot: SlotDefinition): number {
    const minutes = timeToMinutes(slot.time);
    if (slot.service === "lunch") return minutes >= 720 && minutes <= 780 ? 3 : 1.5;
    if (minutes >= 1080 && minutes <= 1170) return 5; // 6:00–7:30 PM
    return 2;
  }

  function addBooking(date: DateKey, time: string, options: { keepActive?: boolean } = {}) {
    const firstName = pickOne(rand, FIRST_NAMES);
    const lastName = pickOne(rand, LAST_NAMES);
    const occasion = pickWeighted(rand, OCCASIONS);
    const occasionRequests = OCCASION_REQUESTS[occasion];
    const specialRequests =
      occasionRequests && rand() < 0.7
        ? pickOne(rand, occasionRequests)
        : rand() < 0.3
          ? pickOne(rand, GENERAL_REQUESTS)
          : "";
    const createdAt = new Date(instant.getTime() - randomInt(rand, 2, 14 * 24) * 60 * 60 * 1000).toISOString();

    bookings.push({
      id: createId(rand),
      code: generateUniqueBookingCode((code) => bookings.some((booking) => booking.code === code), rand),
      date,
      time,
      partySize: Math.min(settings.maxPartySize, pickWeighted(rand, PARTY_SIZES)),
      firstName,
      lastName,
      email: `${firstName}.${lastName}@example.com`.toLowerCase(),
      // 555-0100 through 555-0199 are reserved for fictional use.
      phone: `${pickOne(rand, ["512", "737"])}55501${String(randomInt(rand, 0, 99)).padStart(2, "0")}`,
      occasion,
      specialRequests,
      smsReminder: rand() < 0.6,
      status: seedStatus(date, time, now, rand, options.keepActive),
      createdAt,
      updatedAt: createdAt,
    });
  }

  // Leave at least one table free in regular slots so most of the grid stays bookable.
  function pickOpenSlot(date: DateKey, slots: SlotDefinition[]): SlotDefinition | null {
    const open = slots.filter((slot) => countTablesTaken(bookings, date, slot.time) < settings.tablesPerSlot - 1);
    if (open.length === 0) return null;
    return pickWeighted(rand, open.map((slot) => [slot, slotWeight(slot)] as const));
  }

  let showcaseDate: DateKey | null = null;

  for (let offset = 0; offset <= SEED_DAYS; offset += 1) {
    const date = addDaysToDateKey(now.date, offset);
    const slots = getSlotsForDate(settings, date);
    if (slots.length === 0) continue;

    const weekday = weekdayOf(date);

    // The first Friday or Saturday after today gets a sold-out 7:00 PM and a nearly full 7:30 PM,
    // so the booking flow can show "Full" and "1 table left".
    const isShowcase = !showcaseDate && offset > 0 && (weekday === 5 || weekday === 6);
    if (isShowcase) {
      showcaseDate = date;
      for (const [time, keepFree] of [["19:00", 0], ["19:30", 1]] as const) {
        if (!slots.some((slot) => slot.time === time)) continue;
        while (countTablesTaken(bookings, date, time) < settings.tablesPerSlot - keepFree) {
          addBooking(date, time, { keepActive: true });
        }
      }
    }

    let target = isShowcase ? 3 : DAILY_TARGET[weekday] + (rand() < 0.3 ? 1 : 0);
    if (offset === 0) target = Math.max(target, 6); // keep today's dashboard lively

    for (let index = 0; index < target; index += 1) {
      const slot = pickOpenSlot(date, slots);
      if (slot) addBooking(date, slot.time);
    }
  }

  return bookings.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

function seedStatus(
  date: DateKey,
  time: string,
  now: RestaurantNow,
  rand: RandomSource,
  keepActive = false,
): BookingStatus {
  if (keepActive) return "confirmed";
  const minutesAgo = date === now.date ? now.minutes - timeToMinutes(time) : -1;

  if (minutesAgo < 0) return rand() < 0.08 ? "cancelled" : "confirmed";
  if (minutesAgo < 90) return rand() < 0.12 ? "no_show" : "seated";
  return pickWeighted(rand, [
    ["completed", 84],
    ["no_show", 10],
    ["cancelled", 6],
  ] as const);
}

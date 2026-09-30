import type { DayHours, Settings } from "@/lib/schemas";

const LUNCH = { enabled: true, start: "11:30", end: "14:00" } as const;
const DINNER = { enabled: true, start: "17:00", end: "21:30" } as const;

function openDay(): DayHours {
  return { closed: false, lunch: { ...LUNCH }, dinner: { ...DINNER } };
}

function closedDay(): DayHours {
  // Keep sensible windows so reopening the day in settings starts from the usual hours.
  return { closed: true, lunch: { ...LUNCH }, dinner: { ...DINNER } };
}

/** Open Tuesday through Sunday, closed Mondays. */
export function createDefaultSettings(): Settings {
  return {
    weeklyHours: [openDay(), closedDay(), openDay(), openDay(), openDay(), openDay(), openDay()],
    slotIntervalMinutes: 30,
    tablesPerSlot: 6,
    maxPartySize: 8,
    blackoutDates: [],
  };
}

export const DEFAULT_SETTINGS: Settings = createDefaultSettings();

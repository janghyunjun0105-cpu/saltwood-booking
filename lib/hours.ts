import { getSlotsForDate } from "@/lib/availability";
import type { DayHours, Service, Settings } from "@/lib/schemas";
import { SERVICE_LABELS, SERVICES } from "@/lib/constants";
import {
  WEEKDAY_NAMES,
  addDaysToDateKey,
  formatDateShort,
  formatTime,
  formatTimeRange,
  timeToMinutes,
  weekdayOf,
  type DateKey,
  type RestaurantNow,
  type TimeKey,
} from "@/lib/time";

/** Monday-first order reads more naturally on a restaurant's hours card. */
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export interface HoursRow {
  /** "Monday" or "Tue – Sun" */
  label: string;
  /** Accessible label with full day names, e.g. "Tuesday through Sunday". */
  fullLabel: string;
  closed: boolean;
  services: { service: Service; label: string; range: string }[];
}

function isClosed(day: DayHours): boolean {
  return day.closed || (!day.lunch.enabled && !day.dinner.enabled);
}

function daySignature(day: DayHours): string {
  if (isClosed(day)) return "closed";
  return SERVICES.map((service) => {
    const window = day[service];
    return window.enabled ? `${service}:${window.start}-${window.end}` : `${service}:off`;
  }).join("|");
}

/** Groups consecutive weekdays that share the same hours. */
export function summarizeWeeklyHours(settings: Settings): HoursRow[] {
  const rows: { days: number[]; day: DayHours }[] = [];
  for (const weekday of DISPLAY_ORDER) {
    const day = settings.weeklyHours[weekday];
    const last = rows.at(-1);
    if (last && daySignature(last.day) === daySignature(day)) {
      last.days.push(weekday);
    } else {
      rows.push({ days: [weekday], day });
    }
  }

  return rows.map(({ days, day }) => {
    const first = WEEKDAY_NAMES[days[0]];
    const last = WEEKDAY_NAMES[days[days.length - 1]];
    const single = days.length === 1;
    return {
      label: single ? first : `${first.slice(0, 3)} – ${last.slice(0, 3)}`,
      fullLabel: single ? first : `${first} through ${last}`,
      closed: isClosed(day),
      services: isClosed(day)
        ? []
        : SERVICES.filter((service) => day[service].enabled).map((service) => ({
            service,
            label: SERVICE_LABELS[service],
            range: formatTimeRange(day[service].start, day[service].end),
          })),
    };
  });
}

export type ServiceStatus =
  | { kind: "serving"; service: Service; lastSeating: TimeKey }
  | { kind: "upcoming"; service: Service; date: DateKey; time: TimeKey }
  | { kind: "none" };

/** Is a service seating right now, and if not, when is the next seating? */
export function getServiceStatus(settings: Settings, now: RestaurantNow): ServiceStatus {
  const todaySlots = getSlotsForDate(settings, now.date);
  const today = settings.weeklyHours[weekdayOf(now.date)];

  if (todaySlots.length > 0) {
    for (const service of SERVICES) {
      const window = today[service];
      if (!window.enabled) continue;
      if (now.minutes >= timeToMinutes(window.start) && now.minutes <= timeToMinutes(window.end)) {
        return { kind: "serving", service, lastSeating: window.end };
      }
    }
    const later = todaySlots.find((slot) => timeToMinutes(slot.time) > now.minutes);
    if (later) return { kind: "upcoming", service: later.service, date: now.date, time: later.time };
  }

  for (let offset = 1; offset <= 14; offset += 1) {
    const date = addDaysToDateKey(now.date, offset);
    const first = getSlotsForDate(settings, date)[0];
    if (first) return { kind: "upcoming", service: first.service, date, time: first.time };
  }
  return { kind: "none" };
}

export function describeServiceStatus(status: ServiceStatus, now: RestaurantNow): string {
  if (status.kind === "serving") {
    return `Seating for ${status.service} until ${formatTime(status.lastSeating)}`;
  }
  if (status.kind === "upcoming") {
    const label = SERVICE_LABELS[status.service];
    if (status.date === now.date) return `${label} seating starts at ${formatTime(status.time)}`;
    if (status.date === addDaysToDateKey(now.date, 1)) return `Closed now · Opens tomorrow at ${formatTime(status.time)}`;
    return `Closed now · Opens ${formatDateShort(status.date)} at ${formatTime(status.time)}`;
  }
  return "Closed now";
}

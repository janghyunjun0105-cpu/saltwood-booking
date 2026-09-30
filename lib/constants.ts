/**
 * Plain constants and labels shared by the UI and the zod schemas.
 * Kept free of zod so light components (hours card, status chips) don't pull
 * the validation library into their bundle.
 */

export const BOOKING_STATUSES = ["confirmed", "seated", "completed", "no_show", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: "Confirmed",
  seated: "Seated",
  completed: "Completed",
  no_show: "No-show",
  cancelled: "Cancelled",
};

export const OCCASIONS = ["none", "birthday", "anniversary", "business", "other"] as const;
export type Occasion = (typeof OCCASIONS)[number];

export const OCCASION_LABELS: Record<Occasion, string> = {
  none: "None",
  birthday: "Birthday",
  anniversary: "Anniversary",
  business: "Business",
  other: "Other",
};

export const SERVICES = ["lunch", "dinner"] as const;
export type Service = (typeof SERVICES)[number];

export const SERVICE_LABELS: Record<Service, string> = {
  lunch: "Lunch",
  dinner: "Dinner",
};

export const SPECIAL_REQUESTS_MAX = 200;
/** Hard ceiling for the configurable max party size. */
export const PARTY_SIZE_CEILING = 20;
export const NAME_MAX = 50;
export const SLOT_INTERVALS = [15, 30] as const;
export const TABLES_PER_SLOT_MAX = 50;

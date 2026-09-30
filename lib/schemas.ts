import { z } from "zod";
import { BOOKING_CODE_PATTERN } from "@/lib/bookingCode";
import {
  BOOKING_STATUSES,
  NAME_MAX,
  OCCASIONS,
  PARTY_SIZE_CEILING,
  SERVICES,
  SPECIAL_REQUESTS_MAX,
  TABLES_PER_SLOT_MAX,
} from "@/lib/constants";
import { isDateKey, isTimeKey, normalizeUsPhone, timeToMinutes } from "@/lib/time";

export type { BookingStatus, Occasion, Service } from "@/lib/constants";

export const dateKeySchema = z.string().refine(isDateKey, { error: "Enter a valid date." });
export const timeKeySchema = z.string().refine(isTimeKey, { error: "Enter a valid time." });

/* ------------------------------------------------------------------ */
/* Bookings                                                            */
/* ------------------------------------------------------------------ */

export const bookingStatusSchema = z.enum(BOOKING_STATUSES);
export const occasionSchema = z.enum(OCCASIONS);

export const bookingSchema = z.object({
  id: z.string().min(1),
  code: z.string().regex(BOOKING_CODE_PATTERN),
  date: dateKeySchema,
  time: timeKeySchema,
  partySize: z.number().int().min(1).max(PARTY_SIZE_CEILING),
  firstName: z.string().min(1).max(NAME_MAX),
  lastName: z.string().min(1).max(NAME_MAX),
  email: z.email(),
  /** 10 digits, no formatting. */
  phone: z.string().regex(/^\d{10}$/),
  occasion: occasionSchema,
  specialRequests: z.string().max(SPECIAL_REQUESTS_MAX),
  smsReminder: z.boolean(),
  status: bookingStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Booking = z.infer<typeof bookingSchema>;

/** What the guest fills in on step 3. Messages are shown inline under each field. */
export const guestDetailsSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "Enter your first name.")
    .max(NAME_MAX, `Keep it under ${NAME_MAX} characters.`),
  lastName: z
    .string()
    .trim()
    .min(1, "Enter your last name.")
    .max(NAME_MAX, `Keep it under ${NAME_MAX} characters.`),
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .pipe(z.email("Enter a valid email address, like name@example.com.")),
  phone: z
    .string()
    .trim()
    .min(1, "Enter your phone number.")
    .refine((value) => normalizeUsPhone(value) !== null, "Enter a 10-digit US phone number, like (512) 555-0147."),
  occasion: occasionSchema,
  specialRequests: z
    .string()
    .trim()
    .max(SPECIAL_REQUESTS_MAX, `Keep special requests under ${SPECIAL_REQUESTS_MAX} characters.`),
  smsReminder: z.boolean(),
});
export type GuestDetailsInput = z.input<typeof guestDetailsSchema>;
export type GuestDetails = z.output<typeof guestDetailsSchema>;

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export const serviceWindowSchema = z.object({
  enabled: z.boolean(),
  start: timeKeySchema,
  /** Last seating, inclusive. */
  end: timeKeySchema,
});
export type ServiceWindow = z.infer<typeof serviceWindowSchema>;

export const dayHoursSchema = z.object({
  closed: z.boolean(),
  lunch: serviceWindowSchema,
  dinner: serviceWindowSchema,
});
export type DayHours = z.infer<typeof dayHoursSchema>;

export const settingsSchema = z
  .object({
    /** Indexed by weekday: 0 = Sunday … 6 = Saturday. */
    weeklyHours: z.array(dayHoursSchema).length(7),
    slotIntervalMinutes: z.union([z.literal(15), z.literal(30)]),
    tablesPerSlot: z
      .number({ error: "Enter a number." })
      .int("Use a whole number.")
      .min(1, "At least 1 table.")
      .max(TABLES_PER_SLOT_MAX, `No more than ${TABLES_PER_SLOT_MAX} tables.`),
    maxPartySize: z
      .number({ error: "Enter a number." })
      .int("Use a whole number.")
      .min(1, "At least 1 guest.")
      .max(PARTY_SIZE_CEILING, `No more than ${PARTY_SIZE_CEILING} guests.`),
    blackoutDates: z.array(dateKeySchema),
  })
  .superRefine((settings, context) => {
    settings.weeklyHours.forEach((day, weekday) => {
      if (day.closed) return;
      for (const service of SERVICES) {
        const window = day[service];
        if (window.enabled && timeToMinutes(window.end) < timeToMinutes(window.start)) {
          context.addIssue({
            code: "custom",
            path: ["weeklyHours", weekday, service, "end"],
            message: "Last seating must be after the first seating.",
          });
        }
      }
      if (
        day.lunch.enabled &&
        day.dinner.enabled &&
        timeToMinutes(day.dinner.start) <= timeToMinutes(day.lunch.end)
      ) {
        context.addIssue({
          code: "custom",
          path: ["weeklyHours", weekday, "dinner", "start"],
          message: "Dinner must start after lunch's last seating.",
        });
      }
    });
  });
export type Settings = z.infer<typeof settingsSchema>;

/* ------------------------------------------------------------------ */
/* Persisted state                                                     */
/* ------------------------------------------------------------------ */

export const STATE_VERSION = 1;

export const storedStateSchema = z.object({
  version: z.literal(STATE_VERSION),
  /** Restaurant date the sample data was generated for. */
  seededOn: dateKeySchema,
  settings: settingsSchema,
  bookings: z.array(bookingSchema),
});
export type StoredState = z.infer<typeof storedStateSchema>;

/**
 * Errors the repository can throw. Kept in their own module (no zod, no seed
 * data) so UI code can check for them without loading the whole data layer.
 */
import { BOOKING_CHECK_MESSAGES, type BookingCheckFailure } from "@/lib/availability";
import { RESTAURANT } from "@/lib/restaurant";

export class BookingUnavailableError extends Error {
  constructor(readonly reason: BookingCheckFailure) {
    super(BOOKING_CHECK_MESSAGES[reason]);
    this.name = "BookingUnavailableError";
  }
}

export class BookingNotFoundError extends Error {
  constructor() {
    super("We couldn't find that booking.");
    this.name = "BookingNotFoundError";
  }
}

export class BookingLockedError extends Error {
  constructor() {
    super(`This booking can no longer be changed online. Please call us at ${RESTAURANT.phoneDisplay}.`);
    this.name = "BookingLockedError";
  }
}

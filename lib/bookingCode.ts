import { secureRandom, type RandomSource } from "@/lib/random";

/** Uppercase letters and digits, minus the look-alikes 0/O, 1/I/L. */
export const BOOKING_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const BOOKING_CODE_LENGTH = 4;
export const BOOKING_CODE_PATTERN = new RegExp(`^SW-[${BOOKING_CODE_ALPHABET}]{${BOOKING_CODE_LENGTH}}$`);

export function isBookingCode(value: string): boolean {
  return BOOKING_CODE_PATTERN.test(value);
}

export function generateBookingCode(random: RandomSource = secureRandom): string {
  let body = "";
  for (let index = 0; index < BOOKING_CODE_LENGTH; index += 1) {
    body += BOOKING_CODE_ALPHABET[Math.floor(random() * BOOKING_CODE_ALPHABET.length)];
  }
  return `SW-${body}`;
}

/** Generates a code that `isTaken` has not seen. 31^4 ≈ 920k codes, so collisions are rare. */
export function generateUniqueBookingCode(
  isTaken: (code: string) => boolean,
  random: RandomSource = secureRandom,
): string {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const code = generateBookingCode(random);
    if (!isTaken(code)) return code;
  }
  throw new Error("Could not generate a unique booking code.");
}

/**
 * Cleans up what a guest types into a lookup field: "sw-ab2c", "AB2C" and
 * " SW AB2C " all become "SW-AB2C".
 */
export function normalizeBookingCodeInput(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length === BOOKING_CODE_LENGTH) return `SW-${cleaned}`;
  if (cleaned.length === BOOKING_CODE_LENGTH + 2 && cleaned.startsWith("SW")) return `SW-${cleaned.slice(2)}`;
  return input.trim().toUpperCase();
}

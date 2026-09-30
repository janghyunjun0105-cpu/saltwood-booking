import { describe, expect, it } from "vitest";
import {
  BOOKING_CODE_ALPHABET,
  BOOKING_CODE_PATTERN,
  generateBookingCode,
  generateUniqueBookingCode,
  isBookingCode,
  normalizeBookingCodeInput,
} from "@/lib/bookingCode";
import { mulberry32 } from "@/lib/random";

describe("booking codes", () => {
  it("uses the SW-XXXX format", () => {
    for (let index = 0; index < 500; index += 1) {
      expect(generateBookingCode()).toMatch(/^SW-[A-Z2-9]{4}$/);
    }
  });

  it("never uses look-alike characters", () => {
    expect(BOOKING_CODE_ALPHABET).not.toMatch(/[0O1IL]/);
    const random = mulberry32(42);
    for (let index = 0; index < 2000; index += 1) {
      expect(generateBookingCode(random).slice(3)).not.toMatch(/[0O1IL]/);
    }
  });

  it("covers the whole alphabet", () => {
    const seen = new Set<string>();
    const random = mulberry32(7);
    for (let index = 0; index < 2000; index += 1) {
      for (const char of generateBookingCode(random).slice(3)) seen.add(char);
    }
    expect(seen.size).toBe(BOOKING_CODE_ALPHABET.length);
  });

  it("avoids codes that are already taken", () => {
    const taken = new Set<string>();
    const random = mulberry32(1);
    for (let index = 0; index < 300; index += 1) {
      const code = generateUniqueBookingCode((candidate) => taken.has(candidate), random);
      expect(taken.has(code)).toBe(false);
      taken.add(code);
    }
  });

  it("validates codes", () => {
    expect(isBookingCode("SW-AB2C")).toBe(true);
    expect(isBookingCode("SW-AB0C")).toBe(false); // zero
    expect(isBookingCode("SW-ABIC")).toBe(false); // capital i
    expect(isBookingCode("SW-ABC")).toBe(false);
    expect(isBookingCode("XX-AB2C")).toBe(false);
    expect(BOOKING_CODE_PATTERN.test("sw-ab2c")).toBe(false);
  });

  it("normalizes what guests type", () => {
    expect(normalizeBookingCodeInput("sw-ab2c")).toBe("SW-AB2C");
    expect(normalizeBookingCodeInput(" SW AB2C ")).toBe("SW-AB2C");
    expect(normalizeBookingCodeInput("ab2c")).toBe("SW-AB2C");
    expect(normalizeBookingCodeInput("swab2c")).toBe("SW-AB2C");
  });
});

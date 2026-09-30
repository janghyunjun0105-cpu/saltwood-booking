import type { BookingRepository } from "@/lib/storage/bookingRepo";

let repository: Promise<BookingRepository> | null = null;

/**
 * Loads the repository (with zod and the seed data) as its own chunk the first
 * time something needs data, so it never blocks a page's first paint.
 */
export function loadBookingRepo(): Promise<BookingRepository> {
  repository ??= import("@/lib/storage").then((module) => module.bookingRepo);
  return repository;
}

/** Runs one repository call, loading the repository first if needed. */
export async function withRepo<T>(run: (repo: BookingRepository) => Promise<T>): Promise<T> {
  return run(await loadBookingRepo());
}

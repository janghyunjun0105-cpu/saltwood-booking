import { expect, type Page } from "@playwright/test";
import { addDaysToDateKey, getRestaurantNow, weekdayOf, type DateKey } from "../lib/time";

export const ADMIN_SESSION_KEY = "saltwood:admin-session";

/** Today in restaurant time, the same way the app computes it. */
export function restaurantToday(): DateKey {
  return getRestaurantNow().date;
}

/**
 * The seed data sells out 7:00 PM and leaves one table at 7:30 PM on the first
 * Friday or Saturday after today (see lib/seed.ts).
 */
export function showcaseDate(): DateKey {
  const today = restaurantToday();
  for (let offset = 1; offset <= 14; offset += 1) {
    const date = addDaysToDateKey(today, offset);
    const weekday = weekdayOf(date);
    if (weekday === 5 || weekday === 6) return date;
  }
  throw new Error("No Friday or Saturday in the next two weeks");
}

/** First open date strictly after `after` (skips Mondays, which are closed by default). */
export function nextOpenDate(after: DateKey): DateKey {
  let date = addDaysToDateKey(after, 1);
  while (weekdayOf(date) === 1) date = addDaysToDateKey(date, 1);
  return date;
}

/** Radios are visually hidden; guests tap the styled label, so tests do too. */
export async function pickRadio(page: Page, name: string, value: string) {
  await page.locator(`label:has(> input[name="${name}"][value="${value}"])`).first().click();
  await expect(page.locator(`input[name="${name}"][value="${value}"]`).first()).toBeChecked();
}

/** Pick a date with whichever picker is showing (day strip on phones, month grid from 768px). */
export async function pickDate(page: Page, date: DateKey) {
  const width = page.viewportSize()?.width ?? 1280;
  if (width < 768) {
    await pickRadio(page, "date-strip", date);
    return;
  }
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if ((await page.locator(`input[name="date-grid"][value="${date}"]`).count()) > 0) break;
    await page.getByRole("button", { name: "Next month" }).click();
  }
  await pickRadio(page, "date-grid", date);
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "page should not scroll sideways").toBeLessThanOrEqual(0);
}

export interface GuestInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export async function fillGuest(page: Page, guest: GuestInput) {
  await page.getByLabel("First name").fill(guest.firstName);
  await page.getByLabel("Last name").fill(guest.lastName);
  await page.getByLabel("Email", { exact: true }).fill(guest.email);
  await page.getByLabel("Mobile phone").fill(guest.phone);
}

/** Runs the whole booking flow and returns the confirmation code. */
export async function bookTable(
  page: Page,
  { date, time, partySize, guest }: { date: DateKey; time: string; partySize: number; guest: GuestInput },
): Promise<string> {
  await page.goto("/book");
  await pickRadio(page, "party-size", String(partySize));
  await pickDate(page, date);
  await page.getByRole("button", { name: "Continue" }).click();
  await pickRadio(page, "time", time);
  await page.getByRole("button", { name: "Continue" }).click();
  await fillGuest(page, guest);
  await page.getByRole("button", { name: "Confirm booking" }).click();
  await page.waitForURL(/\/book\/confirmation\/SW-/);
  return page.url().split("/").pop() ?? "";
}

export async function signInAsStaff(page: Page) {
  await page.addInitScript((key) => window.sessionStorage.setItem(key, "signed-in"), ADMIN_SESSION_KEY);
}
